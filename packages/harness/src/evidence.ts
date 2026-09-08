/**
 * The evidence pack types: the deterministic query results assembled before
 * the first LLM call, so the model starts from grounded history instead of
 * guessing. Pure data shapes — the queries live in the API app.
 */

export type EvidenceActivity = {
  id: string;
  name: string;
  type: string;
  date: string;
  category: string | null;
  subcategory: string | null;
  transactions: { id: string; amount: number; fromAccount: string; toAccount: string }[];
  linkedMovements: { id: string; name: string; amount: number }[];
};

export type EvidenceSimilarMovement = {
  id: string;
  name: string;
  amount: number;
  date: string;
  links: { activityId: string; activityName: string; activityType: string; amount: number }[];
};

export type Evidence = {
  movement: {
    id: string;
    name: string;
    amount: number;
    date: string;
    account: { id: string; name: string; type: string };
  };
  similarMovements: EvidenceSimilarMovement[];
  activitiesByDateWindow: EvidenceActivity[];
  activitiesByName: EvidenceActivity[];
  vocabulary: {
    accounts: { id: string; name: string; type: string }[];
    categories: { id: string; name: string; type: string }[];
    subcategories: { id: string; name: string; category: string | null }[];
    projects: { id: string; name: string }[];
    funds: { id: string; name: string; parentFund: string | null }[];
    counterparties: { id: string; name: string }[];
  };
};
