import * as digitalocean from "@pulumi/digitalocean"
import * as kubernetes from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

const cluster = new digitalocean.KubernetesCluster("infra", {
  region: digitalocean.Region.SGP1,
  version: "latest",
  autoUpgrade: true,
  maintenancePolicy: {
    day: "sunday",
    startTime: "20:00"
  },
  nodePool: {
    name: "default",
    size: digitalocean.DropletSlug.DropletS1VCPU2GB,
    nodeCount: 1,
  }
})

export const kubeconfig = cluster.kubeConfigs[0].rawConfig
