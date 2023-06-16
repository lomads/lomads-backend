const _ = require('lodash')
const DAO = require('@server/modules/dao/dao.model')
const Project = require('@server/modules/project/project.model');
const Task = require('@server/modules/task/task.model');
const config = require('@config/config')
const ObjectId = require('mongodb').ObjectID;

const handleProjectShare = async (req, res) => {
    const { daoId, projectId } = req.params;
    const dao = await DAO.findOne({ url: daoId })
    const project = await Project.findOne({ _id: ObjectId(projectId) })
    res.render("share", {
      title: `${_.get(dao, "name", "")} | ${_.get(project, "name", "")}`,
      description: `${_.get(project, "description", "")}`,
      descrpimage: `${_.get(project, "descrpimage", "")}`,
      baseUrl: config.baseUrl,
      script:
        config.baseUrl.indexOf("app-dev") > -1
          ? "/share/redirect.dev.js"
          : "/share/redirect.prod.js",
    });
}

const handleTaskShare = async (req, res) => {
    const { daoId, taskId } = req.params;
    const dao = await DAO.findOne({ url: daoId })
    const task = await Task.findOne({ _id: ObjectId(taskId) })
    res.render("share", {
      title: `${_.get(dao, "name", "")} | ${_.get(task, "name", "")}`,
      description: `${_.get(task, "description", "")}`,
      descrpimage: `${_.get(task, "descrpimage", "")}`,
      baseUrl: config.baseUrl,
      script:
        config.baseUrl.indexOf("app-dev") > -1
          ? "/share/redirect.dev.js"
          : "/share/redirect.prod.js",
    });
}

module.exports = {
    handleProjectShare,
    handleTaskShare
}