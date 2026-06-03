# The Fact Floor

Internal staff guessing game for Currency Partners.

---

## Deploy in 4 steps

### 1. Supabase — create the database

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor → New query**
3. Paste the contents of `supabase-schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key

### 2. GitHub — push the code

```bash
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/factfloor.git
git push -u origin main
```

### 3. Vercel — deploy

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
   - `ADMIN_KEY` → any secret password you choose (Saska will use this)
4. Click **Deploy**

### 4. Share the URL with staff

Vercel will give you a URL like `factfloor-xyz.vercel.app`. Share that link.

---

## Using the app

**Staff:** Go to the URL, select your name, pick who you think the fact belongs to.

**Admin (Saska):** Click the Admin tab, enter the admin key, update the fact/answer/round name each month. Saving a new round automatically clears old guesses.

---

## Each new round

1. Admin tab → update round name, fact, and answer → Save round
2. Share the link in The Exchange newsletter
3. Watch the leaderboard fill up
