import { z } from 'zod';

export const REPLICACHE_PUSH_VERSION = 1;
export const REPLICACHE_PULL_VERSION = 1;

export const ReplicacheMutationSchema = z.object({
  clientID: z.string().min(1),
  id: z.number().int().positive(),
  name: z.string().min(1),
  args: z.unknown(),
  timestamp: z.number(),
});

export type ReplicacheMutation = z.infer<typeof ReplicacheMutationSchema>;

export const ReplicachePushRequestSchema = z.object({
  pushVersion: z.literal(REPLICACHE_PUSH_VERSION),
  clientGroupID: z.string().min(1),
  profileID: z.string().min(1),
  schemaVersion: z.string(),
  mutations: z.array(ReplicacheMutationSchema),
});

export type ReplicachePushRequest = z.infer<typeof ReplicachePushRequestSchema>;

export const ReplicachePullRequestSchema = z.object({
  pullVersion: z.literal(REPLICACHE_PULL_VERSION),
  clientGroupID: z.string().min(1),
  profileID: z.string().min(1),
  schemaVersion: z.string(),
  cookie: z.union([z.null(), z.number(), z.string()]),
});

export type ReplicachePullRequest = z.infer<typeof ReplicachePullRequestSchema>;

export const ReplicachePatchPutSchema = z.object({
  op: z.literal('put'),
  key: z.string(),
  value: z.unknown(),
});

export const ReplicachePatchDelSchema = z.object({
  op: z.literal('del'),
  key: z.string(),
});

export const ReplicachePatchClearSchema = z.object({
  op: z.literal('clear'),
});

export const ReplicachePatchOperationSchema = z.discriminatedUnion('op', [
  ReplicachePatchPutSchema,
  ReplicachePatchDelSchema,
  ReplicachePatchClearSchema,
]);

export type ReplicachePatchOperation = z.infer<
  typeof ReplicachePatchOperationSchema
>;

export const ReplicachePullResponseSchema = z.object({
  cookie: z.union([z.number(), z.string(), z.null()]),
  lastMutationIDChanges: z.record(z.string(), z.number()),
  patch: z.array(ReplicachePatchOperationSchema),
});

export type ReplicachePullResponse = z.infer<
  typeof ReplicachePullResponseSchema
>;
