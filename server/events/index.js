module.exports = {
    discordMessageCreated: require('@events/discordMessageCreated'),
    projectCreated: require('@events/projectCreated'),
    projectDeleted: require('@events/projectDeleted'),
    projectMemberRemoved: require('@events/projectMemberRemoved'),
    memberInvitedToProject: require('@events/memberInvitedToProject'),
    taskCreated: require('@events/taskCreated'),
    taskAssigned: require('@events/taskAssigned'),
    taskApplied: require('@events/taskApplied'),
    taskSubmitted: require('@events/taskSubmitted'),
    taskSubmissionApprove: require('@events/taskSubmissionApprove'),
    taskSubmissionRejected: require('@events/taskSubmissionRejected'),
    taskPaid: require('@events/taskPaid'),
    taskDeleted: require('@events/taskDeleted'),
    daoMemberAdded: require('@events/daoMemberAdded'),
    memberJoinedDiscordServer: require('@events/memberJoinedDiscordServer'),
    onOneMinuteCron: require('@server/events/onOneMinuteCron')
}