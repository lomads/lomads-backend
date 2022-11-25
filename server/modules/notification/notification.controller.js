const Notification = require('@server/modules/notification/notification.model');

const load = async (req, res) => {
    const { _id } = req.user;
    const { timeline = 0, dao = null, limit = 10, page = 1, sort = -1, sortBy = 'createdAt' } = req.query;
    try {
        let filter = { daoId: dao, read: { '$nin': [_id] }  }
        if(timeline)
            filter = { ...filter, '$or': [ { to: null }, { to: { '$ne': _id } } ] }
        else
            filter = { ...filter, to: _id }
        console.log(filter)
        const notifications = await Notification.find(filter)
                            .populate('to project task')
                            .sort({[sortBy]: sort })
                            .skip((+page - 1) * +limit)
                            .limit(+limit);
        const total = await Notification.countDocuments(filter);
        const data = { data: notifications, itemCount: total, totalPages: total > limit ? Math.ceil(total/limit) : 1 };
        return res.status(200).json(data);
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Something went wrong' })
    }
}


module.exports = { load };