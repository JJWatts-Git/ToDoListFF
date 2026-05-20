# ToDoAppFF
Todo list app with feature flag for cat facts

You can identify a feature flag by checking a box on a task and marking it complete.
If the flag is true and on, you will see a random cat fact. 
If the flag is false or off, you will just get a "Great job completing that task!" message with no cat fact.
My flag configuration in the screenshot below:
<img width="1478" height="822" alt="image" src="https://github.com/user-attachments/assets/4f362b33-32e8-4fc9-8718-d195bb597a87" />

The app is already compiled. In order to run the app. Navigate to the app directory and open the index.html file in your favorite browser(tested in chrome).

A couple things to note.
1. The only code that will need to be changed will be in the /src/index.js file to put in your environment variables.

   1- Lines 11-37 is the contexts. If you want to try the custom rules and see how different users fit, you can comment out and use different users. The screenshot below shows my LD UI configuration for the feture flag.
 
   <img width="569" height="460" alt="image" src="https://github.com/user-attachments/assets/5421421f-dd42-451a-85be-59544aa771f7" />

   2- Line 41 is where your client key needs to be put in.

   3- Lines 48, 179, 273, and 274 are where you would put in your flag key, assuming the key name is different.
3. Although the app is compiled, in case you need to change code you will need to rebuild the app. I used npx, which is built into node.js
4. The only language used is node.js in order to use NPM package management. My build uses lates versions, but that should all be built into the app.
5. I built the app in windows, but tested running it on my Mac and had no issues
