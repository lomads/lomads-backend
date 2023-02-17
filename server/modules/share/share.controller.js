const _ = require('lodash')
const DAO = require('@server/modules/dao/dao.model')
const Project = require('@server/modules/project/project.model');
const config = require('@config/config')
const ObjectId = require('mongodb').ObjectID;

const handleProjectShare = async (req, res) => {
    const { daoId, projectId } = req.params;
    const dao = await DAO.findOne({ url: daoId })
    const project = await Project.findOne({ _id: ObjectId(projectId) })
    res.render('project', { 
        title: `${_.get(dao, 'name', '')} | ${_.get(project, 'name', '')}`,
        description: `${_.get(project, 'description', '')}`,
        baseUrl: config.baseUrl,
        script: config.baseUrl.indexOf('app-dev') > -1 ? '/project.dev.js' : '/project.prod.js'
    });
}

module.exports = {
    handleProjectShare
}