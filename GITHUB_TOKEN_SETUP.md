# GitHub Token Setup Guide

## Problem
The GitHub import feature requires a Personal Access Token (PAT) with specific permissions. The `contents` permission alone is **not sufficient** to list repositories or access organization/user information.

## Required Token Scopes

To use the GitHub import feature, your token needs these OAuth scopes:

### For Public Repositories
- **`public_repo`** - Access public repositories

### For Organization Access
- **`read:org`** - Read organization membership, teams, and list members

### For User Information  
- **`read:user`** - Read user profile data

### For Private Repositories (optional)
- **`repo`** - Full control of private repositories (includes `public_repo`)

## Recommended Configuration

**For most use cases (public data only):**
```
✓ public_repo
✓ read:org
✓ read:user
```

**For accessing private repositories:**
```
✓ repo (replaces public_repo)
✓ read:org
✓ read:user
```

## How to Create a Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Direct link: https://github.com/settings/tokens

2. Click "Generate new token (classic)"

3. Give your token a descriptive name (e.g., "GraphSense App")

4. Select the required scopes:
   - Under "repo", check:
     - `repo` (for private repos) OR `public_repo` (for public repos only)
   - Under "admin:org", check:
     - `read:org`
   - Under "user", check:
     - `read:user`

5. Click "Generate token"

6. **Copy the token immediately** - you won't be able to see it again

## Using the Token

Paste your token into the "GitHub Token" field in the application's GitHub Import panel.

## Troubleshooting

### Error: "403 Forbidden"
- **Cause**: Token doesn't have required permissions
- **Solution**: Create a new token with `repo` (or `public_repo`), `read:org`, and `read:user` scopes

### Error: "401 Unauthorized"
- **Cause**: Token is invalid or expired
- **Solution**: Generate a new token

### Error: "404 Not Found"
- **Cause**: Organization/user name is incorrect, or resource is private without proper permissions
- **Solution**: 
  - Double-check the username/organization name
  - If accessing private data, ensure your token has `repo` scope

### Rate Limit Exceeded
- **Cause**: Too many API requests
- **Solution**: Wait for rate limit to reset (check console for reset time)
- **Note**: Authenticated requests have higher rate limits (5000/hour vs 60/hour for unauthenticated)

## What Each Scope Does

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `public_repo` | Access public repositories | Listing public repos |
| `repo` | Full access to private/public repos | Listing private repos, repo contents |
| `read:org` | Read org membership and teams | Listing organizations, org members |
| `read:user` | Read user profile data | Fetching user information |
| ~~`contents`~~ | ❌ Read/write repo file contents | ❌ Not sufficient for listing repos |

## Security Best Practices

1. **Use Classic Tokens**: Fine-grained tokens may have different scope requirements
2. **Minimal Scopes**: Only grant the permissions you need
3. **Set Expiration**: Configure an expiration date for your tokens
4. **Rotate Regularly**: Generate new tokens periodically
5. **Keep Private**: Never commit tokens to version control
6. **Revoke Unused**: Delete tokens you're no longer using

## API Endpoints Used

The adapter makes requests to these GitHub API endpoints:

| Endpoint | Scope Required |
|----------|---------------|
| `/orgs/{org}` | `read:org` |
| `/orgs/{org}/repos` | `read:org` or `public_repo`/`repo` |
| `/orgs/{org}/members` | `read:org` |
| `/users/{user}` | `read:user` |
| `/users/{user}/repos` | `public_repo` or `repo` |
| `/user` | `read:user` |

## Further Reading

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub OAuth Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [GitHub REST API Authentication](https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api)
