---
title: gRPC API
---

# gRPC API reference

The contract is defined once, in the proto repo at `proto/priompt/v1/prompt.proto` (package `priompt.v1`).

```protobuf
service PromptService {
  rpc GetPrompt(GetPromptRequest)         returns (GetPromptResponse);
  rpc DiffPrompt(DiffPromptRequest)       returns (DiffPromptResponse);   // stored vs an edit
  rpc PublishPrompt(PublishPromptRequest) returns (PublishPromptResponse);
  rpc History(HistoryRequest)             returns (HistoryResponse);      // commit log of a branch
  rpc CreateBranch(CreateBranchRequest)   returns (CreateBranchResponse);
  rpc MergeBranch(MergeBranchRequest)     returns (MergeBranchResponse);
  rpc DiffCommits(DiffCommitsRequest)     returns (DiffPromptResponse);   // any two commits
  rpc SetBranch(SetBranchRequest)         returns (SetBranchResponse);    // rollback / pin a branch
  rpc ListPrompts(ListPromptsRequest)     returns (ListPromptsResponse);  // browse a URI prefix
}
```

`GetPromptRequest` takes an optional `ref` (a branch name or commit hash) to fetch a pinned version instead of the served HEAD. The response then includes the `commit_hash` it served.

## Key messages

```protobuf
message PublishPromptRequest {
  string uri = 1;
  string template = 2;
  repeated string slots = 3;
  string message = 4;   // optional commit message
  string branch  = 5;   // target branch; empty = "main"
}

message Commit {
  string hash = 1;
  string version_hash = 2;
  string parent = 3;
  string parent2 = 4;     // set only on merge commits
  string author = 5;
  string message = 6;
  string created_at = 7;  // RFC3339
}

message HistoryRequest      { string uri = 1; string branch = 2; }   // branch empty = "main"
message CreateBranchRequest { string uri = 1; string name = 2; string from = 3; }
message MergeBranchRequest  { string uri = 1; string into = 2; string from = 3; string message = 4; }
message DiffCommitsRequest  { string uri = 1; string from_hash = 2; string to_hash = 3; }
```

## Auth

Send the metadata header `authorization: Bearer <token>`. Write RPCs (`PublishPrompt`, `CreateBranch`, `MergeBranch`, `SetBranch`) need an `rw` token.

## Errors

| Code | When |
| --- | --- |
| `NotFound` | no prompt, branch, or commit at that identifier |
| `InvalidArgument` | the prompt failed validation, or a required field is empty |
| `Unauthenticated` | missing, wrong, or expired token |
| `PermissionDenied` | the org scope doesn't match the URI, or a read-only token tried to write |
| `ResourceExhausted` | over the per-org rate limit |
| `Aborted` | the branch moved during a publish (compare-and-swap lost). Re-read and retry. |
| `Unavailable` | the change is stored but cache invalidation failed. Retry. |
| `DataLoss` | a stored prompt failed serve-time validation |
| `Internal` | storage or lookup error |
