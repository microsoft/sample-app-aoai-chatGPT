# New Jersey AI Assistant

This document has information specific to the NJ-specific fork of the Microsfot open source OpenAI chat app.

## How to keep NJ version up to date with latest upstream changes

The `nj-stable` branch is deployed to our actual chat application, and we should pull in changes from the microsoft upstream when they come in. Here is how to do so:

1. On the `main` branch, you should see a button to "Sync fork". Open that dropdown and click the "Update" button if the `main` branch is behind the upstream. This automatically pulls new commits from microsoft into our `main` branch.
2. Locally, in the repo folder, check into the `main` branch, and run `git pull` to pull those updates into your local repo.
3. `git checkout nj-stable` to switch to our `nj-stable` branch
4. Run `git pull --rebase origin main` to rebase our NJ-specific changes on top of the latest upstream work. Fix merge conflicts as needed.
5. Run `git push -f` to force push this rebase onto the remote repo. There should not be any commits as part of this push.
6. You should see that the `nj-stable` branch is no longer behind the `main` branch, and only ahead by the commits the NJ team has made.
