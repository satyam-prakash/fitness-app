#!/bin/bash
cd d:/Fitness-app/frontend
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
npm install expo-barcode-scanner
npx expo start --clear
