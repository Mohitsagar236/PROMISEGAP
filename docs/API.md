# API and Server Actions

PromiseGap uses server actions for MVP mutations:

- `signupAction`, `loginAction`, `logoutAction`
- `createDocumentAction`, `extractDocumentPromisesAction`
- `updatePromiseAction`, `addCommentAction`, `addActionItemAction`
- `createCapabilityAction`
- `updateRiskSettingsAction`, `reloadDemoDataAction`

Production API routes should wrap the same business functions with authenticated REST or RPC endpoints for integrations.
