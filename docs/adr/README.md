# Architecture decision records

Short notes on decisions that were not obvious, written at the time they were
made. Each one states what was chosen, what was rejected, and — the part that
matters most — **what would change the answer**.

A decision recorded without its threshold is just an opinion with a date on it.
"MongoDB over Postgres" means nothing; "MongoDB over Postgres, and I would
revisit at ~50k documents or the first time I need a real join" is a position
someone can argue with.

| # | Decision |
|---|---|
| [0001](0001-mongodb-over-postgres-and-neo4j.md) | MongoDB over Postgres and Neo4j |
| [0002](0002-in-process-graph-cache.md) | In-process adjacency snapshot over Redis |
| [0003](0003-jwt-rotation-with-reuse-detection.md) | JWT rotation with reuse detection |
| [0004](0004-testing-philosophy.md) | Testing philosophy, and why there is no coverage target |
| [0005](0005-committed-etl-fixtures.md) | Committed ETL fixtures over live API calls |
