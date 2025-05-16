# HACS Custom Card Boilerplate

This guide acts as a basis for creating new HA lovelace cards. It features:

- The code and repository structure for a basic card
- Using TypeScript and rollup for building releases
- Config UI editor with:
  - Entity list to support multiple entities
  - Some dummy sample settings
  - Supporting actions

Plus, I wanted to document, how such a card can be developed straight in Home Assistant's Studio Code Server (vscode).

Creating a complex card might require a lot of things - getting familiar with how to create Lit components, how to reuse existing small UI building blocks from HA, how to manage actions, how to work with the editor, styling issues, calling services or firing HA events, and so on... For me the most difficult step was deciding to get started (not knowing how difficult this will be), and pull together the basics and learn the foundations. While I can't include everything in this guide and boilerplate, I wanted to give a working basic setup to the community, to make it easier for others to get started. Maybe without having the foundations you would never thought of developing your own card, but seeing how it works and how to get started, you end up creating an awesome card... Enjoy!

Feedback is welcome.

## Environment Setup - Common

### VSCode

- Set up Studio Code Server integration, launch it - it will open the main config directory

### GIT

- Open terminal and configure your main details:

```
git config --global user.name "John Doe"
git config --global user.email johndoe@example.com
```

- Then select "Publish to GitHub" command (ctrl+shift+P in vscode), which will prompt you to log in to github
- Follow the instructions to authorize your vscode instance to connect to your account

You're set, now you can use github directly from HA's vscode.

### Node.js

I recommend setting up Node.js with nvm, so that it's easier to switch to new versions.

Open a terminal in vscode, and check the latest command from [https://github.com/nvm-sh/nvm]:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Then restart the terminal (or open a new terminal) so that nvm gets added to your path.

```
nvm install 22
nvm list
npm install --global yarn
corepack enable
```

This should install Node.js 22, and show that it is selected as the default version, then install the yarn package manager.

## Environment Setup - Repository From Scratch

### Create repository

- Create a new folder in the main (config) folder
- Use File / Add Folder to Workspace to add it as a root folder
- Create your readme file, commit, then publish your changes, which will prompt you to create a new repository on github

## Environment Setup - Repository From Boilerplate

### Create repository

- Fork this repository 
- Use "git clone" from the terminal to clone your fork
- Use File / Add Folder to Workspace to add it as a root folder

## Customize this boilerplate

Set your package `name`, `description`, `repository`, `author` in package.json, and add any new keywords you would like. Consider if MIT license is also good for you.

Change default names (`hacs-boilerplate-card`, `HACS Boilerplate Card`, `HacsBoilerplateCard`, etc.) in the boilerplate, which you will need to replace in:

- hacs.json
- package.json
- rollup.config.dev.js
- rollup.config.js
- src/index.ts

Replace my name with yours in package.json and LICENSE

Run `yarn` to install dependencies, then `yarn rollup` to create your first test build in the `dist` folder.

## Development

During development, use DEV = true in index.ts, and run `yarn start` - this will build the development version of your card straight to the config's www folder (../www from this folder) and run rollup in watch mode, so any changes will issue an immediate rebuild.

Happy coding! 😊 Check out the (official documentation)[https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/] as well!

## Release

For the first release, you can keep the initial 1.0.0 version number.

For a new release, do the below:

- Increase the version in package.json (increase 1.x.0 for minor updates, and x.0.0 for major updates)
- Add your changes to CHANGELOG.md
- Push your changes to github
- Create a production build (with DEV = false in index.ts) to the dist folder
- Create a new release in github with a new tag as well, for example tag 1.1.0, title "Version 1.1.0", and release description should be the same what you added to the changelog
- Attach your built .js file to the release, then submit the release
