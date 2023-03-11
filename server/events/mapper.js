module.exports = {
    "@events/discordMessageCreated": [
      "@listeners/setDiscordLinkNotification"
    ],
    "@events/projectCreated": [
      "@listeners/sendProjectCreateNotification"
    ],
    "@events/memberInvitedToProject": [
      "@listeners/sendMemberInviteNotification"
    ],
    "@events/projectDeleted": [
      "@listeners/sendProjectDeleteNotification"
    ],
    "@events/projectMemberRemoved": [
      "@listeners/sendProjectRemovedNotification"
    ],
    "@events/taskCreated": [
      "@listeners/sendTaskCreatedNotification"
    ],
    "@events/taskAssigned": [
      "@listeners/sendTaskAssignedNotification"
    ],
    "@events/taskApplied": [
      "@listeners/sendTaskAppliedNotification"
    ],
    "@events/taskSubmitted": [
      "@listeners/sendTaskSubmittedNotification"
    ],
    "@events/taskSubmissionApprove": [
      "@listeners/sendTaskSubmissionApproveNotification"
    ],
    "@events/taskSubmissionRejected": [
      "@listeners/sendTaskSubmissionRejectedNotification"
    ],
    "@events/taskPaid": [
      "@listeners/sendTaskPaidNotification"
    ],
    "@events/taskDeleted": [
      "@listeners/sendTaskDeletedNotification"
    ],
    "@events/daoMemberAdded": [
      "@listeners/sendDAOMemberAddedNotification"
    ],
    "@events/memberJoinedDiscordServer.js": [
      "@listeners/attachDiscordMemberRole"
    ],
    "@events/onOneMinuteCron.js": [
      "@listeners/checkRecurringTxn"
    ],
    "@events/guildRoleMemberUpdated.js": [
      "@listeners/syncRolesMembers"
    ]
}