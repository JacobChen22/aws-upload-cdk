#!/bin/bash

dynamo_result=$(aws dynamodb query \
  --table-name "${dynamoDbTableName}" \
  --key-condition-expression "id = :val" \
  --expression-attribute-values '{":val": {"S": "'"${newInputId}"'"}}' \
  --output json)

path=$(echo "$dynamo_result" | jq -r '.Items[0].path.S')
userInput=$(echo "$dynamo_result" | jq -r '.Items[0].userInput.S')

aws s3 cp "s3://upload-file-demo-public/$path" "$userInput"
aws s3 mv "$userInput" "s3://ec2-conversed-object-bucket/$userInput"

shutdown -h now