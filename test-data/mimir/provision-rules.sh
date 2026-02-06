#!/bin/sh
set -e

# Mimir Rules Provisioner
# Automatically provisions all rule files found in /rules directory
# Expected structure: /rules/<namespace>/<group>.yaml

echo 'Waiting for Mimir Ruler API...'
until curl -sS -f http://mimir:9009/prometheus/config/v1/rules >/dev/null 2>&1; do
  sleep 1
done
echo '✓ Mimir Ruler API ready'

# Provision all rule files found in /rules
# Structure: /rules/<namespace>/<group>.yaml
echo 'Provisioning rules from /rules...'
PROVISIONED=0

for namespace_dir in /rules/*/; do
  if [ -d "$namespace_dir" ]; then
    NAMESPACE=$(basename "$namespace_dir")
    echo "  Namespace: $NAMESPACE"
    
    for rule_file in "$namespace_dir"*.yaml "$namespace_dir"*.yml; do
      if [ -f "$rule_file" ]; then
        GROUP=$(basename "$rule_file" .yaml)
        GROUP=$(basename "$GROUP" .yml)
        echo "    - Provisioning group: $GROUP"
        
        if curl -X POST -H 'Content-Type: application/yaml' \
           --data-binary "@$rule_file" \
           -f "http://mimir:9009/prometheus/config/v1/rules/$NAMESPACE" >/dev/null 2>&1; then
          echo "      ✓ Provisioned $NAMESPACE/$GROUP"
          PROVISIONED=$(expr $PROVISIONED + 1)
        else
          echo "      ⚠ Failed to provision $NAMESPACE/$GROUP (may already exist)"
        fi
      fi
    done
  fi
done

if [ "$PROVISIONED" = "0" ]; then
  echo '⚠ No rules provisioned (directory empty or rules already exist)'
else
  echo "✓ Provisioned $PROVISIONED rule group(s)"
fi
