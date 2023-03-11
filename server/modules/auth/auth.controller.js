const Web3Token = require('web3-token');
const Member = require('@server/modules/member/member.model');
const Metadata = require('@server/modules/metadata/metadata.model');
const { toChecksumAddress, checkAddressChecksum } = require('ethereum-checksum-address')


const createAccount = async (req, res) => {
	try {
		member = new Member({ wallet: toChecksumAddress(address), name: '' })
		member = await member.save();
		res.status(201).json(member)
	} catch (e) {
		console.log(e);
		res.status(500).json({ message: 'Something went wrong' })
	}
}

const createAccountAikon = async (req, res, next) => {
	try {
		const { address, name } = req.body;
		const token = req.headers['authorization']
		if (!token)
			return res.status(401).json({ message: 'Authorization token required' })
		console.log("token : ", token);
		console.log("address : ", address);
		let member = await Member.findOne({ wallet: toChecksumAddress(address) })
		if (member) {
			console.log("member exists");
			req.user = member;
			return res.status(200).json(member);
		}
		else {
			console.log("creating new member");
			member = new Member({ wallet: toChecksumAddress(address), name })
			member = await member.save()
			console.log("member : ", member);
			req.user = member;
			return res.status(201).json(member);
		}
	} catch (e) {
		return res.status(500).json({ message: 'Something went wrong' })
	}
}


const update = async (req, res) => {
	const { _id } = req.user;
	console.log("_id : ", _id);
	try {
		let member = await Member.findOneAndUpdate({ _id }, { ...req.body })
		member = await Member.findOne({ _id })
		return res.status(200).json(member)
	} catch (e) {
		console.log(e);
		res.status(500).json({ message: 'Something went wrong' })
	}
}

module.exports = { update, createAccountAikon };
