# Docker deployment: Netflix Audience Ratings

Status: **deployed on 2026-11-07 (Asia/Jakarta)** at [https://netflix-audience-ratings.shafwan.digital](https://netflix-audience-ratings.shafwan.digital). Docker container healthy, HTTPS active and public browser checks passed. See [production evidence](../verification/release.json).

One multi-stage image builds React and installs the frozen Python workspace. FastAPI serves the SPA and API under one origin. The runtime is non-root, read-only, and contains the selected model bundle and dataset profile; source CSV, development dependencies and private environment files are excluded. Image construction validates artifact readiness and run identity. One Uvicorn worker limits duplicate model memory. Native math threads are limited to one.

## VPS layout

The inspected VPS already has Docker Compose and host Nginx. Keep that Nginx as the only public ingress. This app binds **127.0.0.1:8303**, forwarded to container port 8000. Do not expose port 8303 publicly. Use the repository's unique Compose project and image names. No shared container network or application database is needed.

The host has approximately 4 GiB RAM and existing workloads. Start with the supplied 768 MiB container memory limit and one CPU; inspect actual memory under load and adjust `.env.production` if required. Build/deploy one project at a time. Builds also need memory and are not constrained by the runtime limit. If host builds cannot fit, use an external builder/registry instead of increasing concurrent builds.

## 1. Connect from PowerShell

```powershell
ssh -i "$env:USERPROFILE\.ssh\bonjermgu-prod" -o IdentitiesOnly=yes deploy@103.89.4.104
```

All remaining commands run in the VPS Linux shell. SSH private keys stay on your laptop.

## 2. First application deployment

```bash
sudo install -d -o deploy -g deploy /srv/netflix-ml/netflix-audience-ratings
git clone https://github.com/ShafwanAdhi/netflix-audience-ratings.git /srv/netflix-ml/netflix-audience-ratings
cd /srv/netflix-ml/netflix-audience-ratings
cp deploy/production.env.example .env.production
docker compose --env-file .env.production config --quiet
bash scripts/deploy.sh
curl --fail http://127.0.0.1:8303/api/v1/health
curl --fail http://127.0.0.1:8303/api/v1/dataset
curl --fail http://127.0.0.1:8303/dataset
```

The source repository must contain these deployment files before cloning/pulling. A private repository requires your own GitHub authentication; do not copy the VPS SSH key to GitHub or put tokens in clone URLs. No raw dataset or training step is required. Health checks validate project identity, model readiness and matching dataset/model run IDs.

## 3. Subdomain and HTTPS

Create an **A record** for the chosen subdomain pointing to `103.89.4.104`. Only publish an AAAA record if the VPS IPv6 ingress is configured. Confirm DNS and that host ingress permits TCP 80/443. The configured subdomain is **netflix-audience-ratings.shafwan.digital**:

```bash
DOMAIN='netflix-audience-ratings.shafwan.digital'
getent ahostsv4 "$DOMAIN"
# Inspect before installing; do not overwrite an existing site with this name.
sudo test ! -e /etc/nginx/sites-available/netflix-audience-ratings
sudo install -m 644 deploy/nginx.conf /etc/nginx/sites-available/netflix-audience-ratings
sudo ln -s /etc/nginx/sites-available/netflix-audience-ratings /etc/nginx/sites-enabled/netflix-audience-ratings
sudo nginx -t && sudo systemctl reload nginx
curl --fail "http://$DOMAIN/api/v1/health"
```

Run the install steps only if the `test` confirms that the site path is unused. The supplied template assumes the example HOST_PORT=8303; if you change HOST_PORT, update `proxy_pass` too. Existing Nginx sites are retained. The template revalidates cached HTML to avoid stale SPA asset references after updates.

If Certbot is already installed, use it directly. Otherwise, on an Ubuntu/Debian VPS:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

After DNS resolves correctly and the HTTP site responds:

```bash
sudo certbot --nginx -d "$DOMAIN" --redirect
sudo nginx -t
curl --fail "https://$DOMAIN/api/v1/health"
curl --fail "https://$DOMAIN/dataset"
sudo certbot renew --dry-run
```

Certbot prompts for a real notification email and acceptance of its terms. The bootstrap template has no invented certificate paths. Check the renewal timer with `systemctl list-timers --all`.

## Updates, diagnostics and rollback

```bash
cd /srv/netflix-ml/netflix-audience-ratings
git pull --ff-only origin main
bash scripts/deploy.sh
bash scripts/deploy.sh status
docker stats --no-stream
# Restore the saved previous successful image if necessary:
bash scripts/deploy.sh rollback
```

The helper builds a commit-and-timestamp-tagged image before replacing the container and waits for health. If replacement fails and a prior image exists, it attempts to restore that image. First deployment has no previous image. Manual rollback restores the previous runtime image, not the Git checkout. Keep old images while rollback is needed; avoid pruning them. Deployment briefly interrupts this one container; zero downtime is not promised. Do not run `docker compose down` for routine updates or modify unrelated services on this shared host.

Live configuration and image history remain in `.env.production` and `.deploy-state/`, ignored by Git. No model training or report generation occurs in a running container. Resource limits and rotated logs protect shared-host capacity; monitor actual use after deployment.

## Verification before public release

- Build the image and wait for a healthy container; ensure `/api/v1/health` reports artifact readiness and the expected model run.
- Verify `/api/v1/dataset`, all five direct section URLs, fonts, and a real project interaction through HTTPS.
- Confirm localhost binding with `docker compose ps` and DNS/HTTPS for the chosen subdomain.
- The **Container verification** GitHub Actions workflow runs on relevant pushes to `main`, pull requests and manual dispatch. It builds and smoke-tests the image; it does not deploy or publish images.

Local Docker Desktop must have its Linux engine running to build/test on Windows. `docker compose --env-file deploy/production.env.example config --quiet` validates configuration without a daemon.

## Portfolio revision release checks

The image includes the built route HTML and social preview. Before a release, build the frontend, run Python/frontend tests and `corepack pnpm readme:check`, then build and smoke-test the Docker image. Without JavaScript, request each of the five public routes and confirm its title, canonical and Open Graph URL use the correct production domain. Confirm `/social-preview.png` is an image response and `/api/v1/health` reports the intended artifact run.

The portfolio presentation revision does not require retraining or a new model run. Its local verification is separate from older production evidence. Publishing repository changes and updating the VPS are separate release actions.
