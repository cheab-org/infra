# ArgoCD Provisioning

Provision a DigitalOcean Droplet with ArgoCD cluster running inside.

Powered by Pulumi and Kustomize.

## Getting start

1. Make sure `doctl` works.
   
   ```sh
   $ doctl version
   doctl version 1.73.0-release
   ```

2. Make sure `pulumi` works.

   ```sh
   $ pulumi version
   v3.29.1
   ```

3. Make sure you have `kubectl` installed.
   
   ```sh
   $ kubectl version
   Client Version: version.Info{Major:"1", Minor:"22", GitVersion:"v1.22.6", GitCommit:"f59f5c2fda36e4036b49ec027e556a15456108f0", GitTreeState:"clean", BuildDate:"2022-01-19T17:33:06Z", GoVersion:"go1.16.12", Compiler:"gc", Platform:"darwin/amd64"}
   Server Version: version.Info{Major:"1", Minor:"22", GitVersion:"v1.22.8", GitCommit:"7061dbbf75f9f82e8ab21f9be7e8ffcaae8e0d44", GitTreeState:"clean", BuildDate:"2022-03-16T14:04:34Z", GoVersion:"go1.16.15", Compiler:"gc", Platform:"linux/amd64"}
   ```

## Provisioning kubernetes cluster

1. Setup `pulumi` DigitalOcean token.
   
   ```sh
   pulumi config set digitalocean:token your_token --secret
   ```

   The token should have read and write access.

2. Provision kubernetes cluster.
   
   ```sh
   pulumi up
   ```

   This command creates a kubernetes cluster with the token associated to.

3. Get the kube config from DigitalOcean and set it up to your `kubectl` properly.

## Apply ArgoCD

1. (optional) update email in `argocd/overlays/dev/cluster_issuer.yaml` if needed.
2. (optional) update hostname in `argocd/overlays/dev/ingress_nginx_svc.yaml` if needed. This will patch the `ingress-nginx-controller` service. So, make sure the version at label `app.kubernetes.io/version` matched with the one used in `kustomization.yaml` file.
3. (optional) also update hostname in `argocd/overlays/dev/ingress.yaml`.

4. Kustomize ArgoCD.
   
   ```sh
   kustomize build argocd/overlays/dev | kubectl apply -f -
   ```

   This command creates all resources necessary for running ArgoCD with NGINX ingress HTTPs passthrough mode.

5. Create A record and point to Load Balancer external IP.

ArgoCD should be up and running at your hostname with HTTPs enabled.

## Configured ArgoCD to use SSO (recommended)

This repo uses ArgoCD built-in [Dex](https://dexidp.io), a Federated OpenID Connect Provider, to use Github OAuth.

_Note that these steps can be done using `kubectl` CLI, but I recommended using a kubernetes dashboard to avoid a YAML editting error_.

ArgoCD comes with default admin user with a randomly generated password. Since this ArgoCD will use Github SSO only, we need to remove an unnecessary secret first. Then config the built-in dex to use Github SSO.

### Remove initial admin secret

Remove secret resource name `argocd-initial-admin-secret` from `argocd` namespace.

### Setup Github OAuth application

1. Create your own organization (or you can use existing organization).
2. Create OAuth app. At the time of writing, the menu is in _Settings_ > _Developer settings_ > _OAuth Apps_. Save your `clientID` and `clientSecret` safely.

### Config ArgoCD to use Github SSO

1. Add `clientSecret` to secret store. You can create a new resource or use an existing `argocd-secret` in `argocd` namespace. ArgoCD is capable of reading a secret from `argocd-secret` by default for corresponding key start with `$`. _Beware that the clientSecret stored in secret must be in base64 form_.

2. Add data to configmap resource name `argocd-cm` in `argocd` namespace.
   
   ```yaml
   data:
     admin.enabled: "false"
     url: https://argocd.zentetsuken.com
     dex.config: |
       connectors:
         - type: github
           id: github
           name: GitHub
           config:
             clientID: your_client_id
             clientSecret: $dex.github.clientSecret
             orgs:
             - name: your-github-org
   ```

This config disable admin login and enable Github SSO.
