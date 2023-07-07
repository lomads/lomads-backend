const stripe = require('@services/stripe')
const config = require('@config/config')
const _ = require('lodash')
const StripeAccount = require('../payment/stripeaccount.model')
const Contract = require('../contract/contract.model')
const Member = require('../member/member.model')
const ExternalPaymentStatus = require('../mintPayment/externalPaymentStatus.model')

const generateAccountLink = (accountId, origin) => {
    return stripe.accountLinks.create({
      type: "account_onboarding",
      account: accountId,
      refresh_url: `${origin}/onboard-refresh?accountId=${accountId}`,
      return_url: `${origin}/connected-account?accountId=${accountId}`,//`${origin}/payment/connected-account?accountId=${accountId}`,
    }).then((link) => link.url);
  }

const refresh = async (req, res, next) => {
    const { accountId } = req.query;
    if (!accountId) {
        res.status(500).send({ error: "accountId is required"});
        return;
      }
    try {
      const origin = config.baseUrlWithExt;
      const accountLinkURL = await generateAccountLink(accountId, origin)
      res.status(200).json({ url : accountLinkURL })
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }

const connectionSuccess = async (req, res, next) => {
    const { status, accountId } = req.query;
    if (!accountId) {
      res.status(500).send({ error: "accountId is required"});
      return;
    }
    try {
      const account = await stripe.accounts.update(accountId, {
          settings: {
            payouts: {
              schedule: {
                interval: 'manual',
              },
            },
          },
        }
      );
      //const account = await stripe.accounts.retrieve(accountId);
      if(account){
        console.log('account.details_submitted', account.details_submitted)
        if(account.details_submitted && _.get(account, 'capabilities.card_payments', 'inactive') === 'active' && _.get(account, 'capabilities.transfers', 'inactive') === 'active') {
          await StripeAccount.findOneAndUpdate({ 'account.id' : accountId }, { account })
        }
      }
      const stripeAcc = await StripeAccount.findOne({ 'account.id': accountId })
      return res.status(200).send(stripeAcc);
    } catch (e) {
      console.log(e)
      res.status(500).send({ error: e });
    }
  }
  
   

const onboard = async (req, res) => {
    const { _id } = req.user;
    let { accountId } = req.query;
    // let stripeAcc = await StripeAccount.findOne({ owner: _id })

    // if(stripeAcc) 
    //     accountId = stripeAcc?.account?.id

    try {
        let accId = null;
        if(!accountId){
          const account = await stripe.accounts.create({
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            type: "express"
          });
          accId =  account.id;
          stripeAcc = await StripeAccount.create({ account, owner: _id })
        } else {
          accId =  accountId;
        }
        const origin = config.baseUrl;
        const accountLinkURL = await generateAccountLink(accId, origin);
        res.send({ url : accountLinkURL, stripeAcc });
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const loadStripeAccounts = async (req, res) => {
    const { _id } = req.user;
    try {
        const accounts = await StripeAccount.find({ owner: _id })
        return res.status(200).json(accounts)
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

const generateResponse = (intent) => {
    // Generate a response based on the intent's status
    switch (intent.status) {
      case "requires_action":
      case "requires_source_action":
        // Card requires authentication
        return {
          requiresAction: true,
          paymentIntentId: intent.id,
          clientSecret: intent.client_secret
        };
      case "requires_payment_method":
      case "requires_source":
        // Card was not properly authenticated, suggest a new payment method
        return {
          error: "Your card was denied, please provide a new payment method"
        };
      case "succeeded":
        console.log("💰 Payment received!");
        return { success: true, clientSecret: intent.client_secret };
    }
  };
  

const initializePayment = async (req, res) => {
    let { _id, stripeCustomerId, wallet } = req.user;
    const { contractAddress } = req?.params
    const { payment_method_id, amount, tokenId, payment_intent_id, save_card = false, email, name } = req.body;

    try {
        const contract = await Contract.findOne({ address: contractAddress })
        const stripeAccount = await StripeAccount.findOne({ _id: contract?.stripeAccount })

        if(!stripeCustomerId) {
            const customer = await stripe.customers.create({ email, name });
            stripeCustomerId = customer.id
            await Member.findOneAndUpdate({ _id }, { stripeCustomerId })
        }
        let intent;
        if (payment_method_id && payment_method_id !== '') {
            let paymentIntentData = {
                    payment_method: payment_method_id,
                    amount: +amount * 100,
                    application_fee_amount: (0 * 100),
                    currency: 'USD',
                    confirmation_method: 'manual',
                    confirm: true,
                    description: `(TOKEN-ID) ${tokenId}`,
                    metadata: {
                        wallet,
                        tokenId: tokenId
                    },
                    transfer_group: contractAddress,
                    transfer_data: {
                        destination: stripeAccount?.account?.id
                    },
                    customer: stripeCustomerId,
                    ...(+save_card === true ? { setup_future_usage: 'off_session' } : {})
             };
            intent = await stripe.paymentIntents.create(paymentIntentData)
        } else if (payment_intent_id && payment_intent_id !== '') {
            intent = await stripe.paymentIntents.confirm(payment_intent_id);
        }
        if(intent){
            if(intent.status === 'succeeded'){    
            //   await MintPayment.create({ contract: contractAddress, txnReference: intent?.id, paymentType: "card", account: wallet, verified: true })     
              const ep = await ExternalPaymentStatus.create({ response: intent, provider: 'stripe', member: _id })    
              return res.send({ ...generateResponse(intent), txReference: ep._id, stripeResponse: intent });
            } else {
              return res.send(generateResponse(intent));
            }
        }
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { onboard, refresh, connectionSuccess, loadStripeAccounts, initializePayment };