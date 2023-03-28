const web3AdminAuth = async (req, res, next) => {
    try {
        if(req?.user && req?.user?.platformRole && req?.user?.platformRole === 'admin')
            next();
        return res.status(401).json({ message: 'Unauthorised' })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}

module.exports = web3AdminAuth;