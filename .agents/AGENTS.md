# Workspace Rules: Jira Task Linking for Feature Branches

Whenever creating a new branch or recommending Pull Request details:
1. **Identify Jira Keys:** Find all the Jira keys (e.g., `KAN-2`, `KAN-3`) corresponding to the features or tasks being developed in this feature branch.
2. **Branch Naming:** Format the branch name to include the relevant Jira keys.
   - *Example:* `feature/KAN-2-KAN-3-backend-setup`
3. **Pull Request Titles:** Ensure any proposed Pull Request titles list the keys so they link to Jira.
   - *Example:* `KAN-2 KAN-3: Setup Express scaffold and Prisma client`
4. **Commits:** Normal commit messages are fine; the automation will rely on the PR merge.
