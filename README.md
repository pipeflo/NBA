# watsonwork-bot-seed

A starter project for creating bots with Watson Work Services.

## developing

The starter will take care of things like setting up Express, handling the webhooks, and ignoring messages from your application.  You can insert your code inside the following convenience functions:
+ messageCreated
+ spaceMembersAdded
+ spaceMembersRemoved
+ messageAnnotationAdded
+ messageAnnotationEdited
+ messageAnnotationRemoved

You can also reuse helper functions:
+ respond

An example todo-bot has been included to demonstrate additional functionality.

## installation and usage

1. Go to [Register an App](https://workspace.ibm.com/developer/apps) page.
2. On the left, enter the `App Name` and the `Description of App`.
3. Click on `Add an outbound webhook`.
4. Give the webhook a name (any name will do) and select any of the webhooks. This is how we'll listen to messages in a space.
5. In the callback URL, specify the URL for your app, eg. `http://my-sample.mybluemix.net/webhook`.
6. Click on `Register app`
7. This will give you the App ID, App secret, and Webhook secret. You *need to save* these to environment variables called `APP_ID`, `APP_SECRET`, and `WEBHOOK_SECRET` respectively.  Or use them directly in your code.
8. Follow the instructions in [Authorize an App](https://workspace.ibm.com/developer/docs) to add the app to a space.
9. Type an action in the space, eg. 'We need to set up a meeting with Van'.
# wwseed
