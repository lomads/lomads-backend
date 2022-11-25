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
    ]
}