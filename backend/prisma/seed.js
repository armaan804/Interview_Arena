const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roles = [
  { name: "SDE", description: "Software Development Engineer — DSA, system design, CS fundamentals" },
  { name: "Data Analyst", description: "SQL, statistics, data interpretation, business case questions" },
  { name: "Frontend Developer", description: "JavaScript, React, CSS, browser fundamentals" },
  { name: "Product Manager", description: "Product sense, case studies, prioritization, guesstimates" },
  { name: "Consulting", description: "Case interviews, market sizing, structured problem solving" },
];

const topicData = [
  {
    roleName: "SDE",
    topicName: "DSA",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "What is the time complexity of binary search on a sorted array of n elements?",
        optionA: "O(n)",
        optionB: "O(log n)",
        optionC: "O(n log n)",
        optionD: "O(1)",
        correctOption: "B",
        explanation: "Binary search halves the search space each step, giving O(log n) time.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "Which data structure uses LIFO (Last In First Out) ordering?",
        optionA: "Queue",
        optionB: "Stack",
        optionC: "Linked List",
        optionD: "Graph",
        correctOption: "B",
        explanation: "A stack pops the most recently pushed element first — LIFO order.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What is the worst-case time complexity of QuickSort?",
        optionA: "O(n log n)",
        optionB: "O(n)",
        optionC: "O(n^2)",
        optionD: "O(log n)",
        correctOption: "C",
        explanation: "QuickSort degrades to O(n^2) when the pivot repeatedly splits the array unevenly (e.g. already sorted input with a naive pivot choice).",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "Which traversal of a Binary Search Tree visits nodes in ascending sorted order?",
        optionA: "Pre-order",
        optionB: "Post-order",
        optionC: "In-order",
        optionD: "Level-order",
        correctOption: "C",
        explanation: "In-order traversal (left, root, right) visits BST nodes in ascending order.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "What is the time complexity of building a heap from an unsorted array of n elements?",
        optionA: "O(n log n)",
        optionB: "O(n)",
        optionC: "O(n^2)",
        optionD: "O(log n)",
        correctOption: "B",
        explanation: "Heapify-based heap construction runs in O(n), not O(n log n), due to the amortized cost across levels.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "In a graph with negative edge weights but no negative cycles, which algorithm correctly computes shortest paths from a single source?",
        optionA: "Dijkstra's algorithm",
        optionB: "Bellman-Ford algorithm",
        optionC: "Prim's algorithm",
        optionD: "Kruskal's algorithm",
        correctOption: "B",
        explanation: "Dijkstra's fails with negative weights; Bellman-Ford handles them correctly as long as there's no negative cycle.",
      },
    ],
  },
  {
    roleName: "SDE",
    topicName: "DBMS",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "Which SQL clause is used to filter groups after a GROUP BY?",
        optionA: "WHERE",
        optionB: "HAVING",
        optionC: "FILTER",
        optionD: "ORDER BY",
        correctOption: "B",
        explanation: "HAVING filters aggregated groups; WHERE filters rows before grouping.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "What does ACID stand for in database transactions?",
        optionA: "Atomicity, Consistency, Isolation, Durability",
        optionB: "Accuracy, Consistency, Integrity, Durability",
        optionC: "Atomicity, Concurrency, Isolation, Data-integrity",
        optionD: "Availability, Consistency, Isolation, Durability",
        correctOption: "A",
        explanation: "ACID = Atomicity, Consistency, Isolation, Durability — the four guarantees of reliable transactions.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "Which normal form eliminates transitive dependency on the primary key?",
        optionA: "1NF",
        optionB: "2NF",
        optionC: "3NF",
        optionD: "BCNF",
        correctOption: "C",
        explanation: "3NF removes transitive dependencies — non-key attributes depending on other non-key attributes.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What type of join returns all rows from the left table and matched rows from the right table, with NULLs where there's no match?",
        optionA: "INNER JOIN",
        optionB: "LEFT JOIN",
        optionC: "RIGHT JOIN",
        optionD: "CROSS JOIN",
        correctOption: "B",
        explanation: "LEFT JOIN keeps all left-table rows, filling unmatched right-table columns with NULL.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "Which isolation level prevents dirty reads and non-repeatable reads, but still allows phantom reads?",
        optionA: "Read Uncommitted",
        optionB: "Read Committed",
        optionC: "Repeatable Read",
        optionD: "Serializable",
        correctOption: "C",
        explanation: "Repeatable Read locks the rows it reads (preventing non-repeatable reads) but doesn't lock ranges, so phantom reads can still occur.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "What is the primary purpose of a B+ Tree index in most relational databases?",
        optionA: "To store data in random order for faster writes",
        optionB: "To enable efficient range queries and ordered traversal on disk",
        optionC: "To enforce foreign key constraints",
        optionD: "To compress table storage size",
        correctOption: "B",
        explanation: "B+ Trees keep data sorted with linked leaf nodes, making range scans and ordered lookups efficient on disk.",
      },
    ],
  },
  {
    roleName: "Data Analyst",
    topicName: "SQL",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "Which SQL function returns the number of rows in a result set?",
        optionA: "SUM()",
        optionB: "COUNT()",
        optionC: "TOTAL()",
        optionD: "LEN()",
        correctOption: "B",
        explanation: "COUNT() returns the number of rows matching a query.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "What does the DISTINCT keyword do in a SELECT statement?",
        optionA: "Sorts the results",
        optionB: "Removes duplicate rows from the result set",
        optionC: "Groups rows by a column",
        optionD: "Filters rows based on a condition",
        correctOption: "B",
        explanation: "DISTINCT removes duplicate rows from the query output.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "Which window function assigns a unique sequential rank to rows, with no gaps even for ties?",
        optionA: "RANK()",
        optionB: "DENSE_RANK()",
        optionC: "ROW_NUMBER()",
        optionD: "NTILE()",
        correctOption: "C",
        explanation: "ROW_NUMBER() always assigns a unique sequential number regardless of ties; RANK/DENSE_RANK can repeat or skip values on ties.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What is the result of a SELF JOIN?",
        optionA: "Joining a table to itself using an alias",
        optionB: "Joining two unrelated tables",
        optionC: "A join that always returns zero rows",
        optionD: "A join that only returns NULL values",
        correctOption: "A",
        explanation: "A self join joins a table to itself, typically using aliases, to compare rows within the same table.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "In a query with both a subquery in WHERE and a JOIN, which generally executes more efficiently for large datasets: a correlated subquery or an equivalent JOIN?",
        optionA: "Correlated subquery, always",
        optionB: "JOIN, generally, since the optimizer can use set-based operations",
        optionC: "They are always identical in performance",
        optionD: "Neither — subqueries are forbidden with JOINs",
        correctOption: "B",
        explanation: "JOINs generally let the query optimizer use efficient set-based execution plans, while correlated subqueries often re-execute per outer row.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "What does a CTE (Common Table Expression) primarily help with?",
        optionA: "Encrypting table data",
        optionB: "Improving query readability and enabling recursive queries",
        optionC: "Automatically indexing a table",
        optionD: "Locking a table for exclusive writes",
        correctOption: "B",
        explanation: "CTEs (WITH clause) make complex queries more readable and are required for recursive queries.",
      },
    ],
  },
  {
    roleName: "Frontend Developer",
    topicName: "JavaScript",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "What does the '===' operator check in JavaScript?",
        optionA: "Value equality only",
        optionB: "Value and type equality",
        optionC: "Reference equality only",
        optionD: "Type equality only",
        correctOption: "B",
        explanation: "'===' is strict equality — it checks both value and type without coercion.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "Which keyword declares a block-scoped variable that cannot be reassigned?",
        optionA: "var",
        optionB: "let",
        optionC: "const",
        optionD: "static",
        correctOption: "C",
        explanation: "const declares a block-scoped binding that cannot be reassigned (though object contents can still mutate).",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What does a JavaScript closure allow a function to do?",
        optionA: "Run asynchronously by default",
        optionB: "Access variables from its outer lexical scope even after that scope has returned",
        optionC: "Automatically parallelize execution",
        optionD: "Directly modify the DOM without re-render",
        correctOption: "B",
        explanation: "A closure retains access to variables in its lexical scope even after the outer function has finished executing.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What is the output of typeof null in JavaScript?",
        optionA: "'null'",
        optionB: "'undefined'",
        optionC: "'object'",
        optionD: "'boolean'",
        correctOption: "C",
        explanation: "typeof null returns 'object' — a long-standing quirk/bug in JavaScript kept for backward compatibility.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "What is the main difference between microtasks and macrotasks in the JS event loop?",
        optionA: "Microtasks (e.g. Promises) run before the next macrotask (e.g. setTimeout), even at 0ms delay",
        optionB: "Macrotasks always run before microtasks",
        optionC: "There is no difference; they run in registration order only",
        optionD: "Microtasks only run in Node.js, not browsers",
        correctOption: "A",
        explanation: "The event loop drains all queued microtasks (Promise callbacks) before moving to the next macrotask, even a setTimeout(fn, 0).",
      },
      {
        difficulty: "ADVANCED",
        questionText: "What does Array.prototype.reduce's initial value parameter control?",
        optionA: "The final array length",
        optionB: "The starting value of the accumulator before processing the first element",
        optionC: "Whether the array is sorted first",
        optionD: "The number of iterations performed",
        correctOption: "B",
        explanation: "The initial value seeds the accumulator; if omitted, reduce uses the first array element as the initial accumulator instead.",
      },
    ],
  },
  {
    roleName: "Product Manager",
    topicName: "Product Sense",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "What does 'MVP' stand for in product development?",
        optionA: "Most Valuable Product",
        optionB: "Minimum Viable Product",
        optionC: "Maximum Viable Performance",
        optionD: "Minimum Value Proposition",
        correctOption: "B",
        explanation: "MVP = Minimum Viable Product — the smallest version of a product that delivers core value to test assumptions.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "What is a 'North Star metric'?",
        optionA: "The company's total revenue",
        optionB: "A single metric that best captures the core value delivered to customers",
        optionC: "The number of employees in product",
        optionD: "A metric only used in marketing",
        correctOption: "B",
        explanation: "A North Star metric is the one metric that best reflects the value a product delivers, guiding team focus.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "In the RICE prioritization framework, what does the 'C' stand for?",
        optionA: "Cost",
        optionB: "Confidence",
        optionC: "Complexity",
        optionD: "Customer",
        correctOption: "B",
        explanation: "RICE = Reach, Impact, Confidence, Effort. Confidence reflects how sure the team is about the reach/impact estimates.",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "What is the main purpose of an A/B test when launching a new feature?",
        optionA: "To guarantee the feature has zero bugs",
        optionB: "To compare a change against a control group and measure causal impact on a metric",
        optionC: "To reduce development cost",
        optionD: "To replace user interviews entirely",
        correctOption: "B",
        explanation: "A/B tests randomly split users between variants to isolate the causal effect of a change on a target metric.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "A feature increases engagement but retention drops after 30 days. What should a PM investigate first?",
        optionA: "Whether the engagement is driven by novelty rather than genuine value",
        optionB: "Immediately roll back with no further analysis",
        optionC: "Increase marketing spend to compensate",
        optionD: "Ignore it since engagement improved",
        correctOption: "A",
        explanation: "A short-term engagement bump with declining retention often signals novelty effect rather than durable value — worth segmenting cohorts to confirm before deciding next steps.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "When two key stakeholders disagree on feature priority, what's generally the most effective first step for a PM?",
        optionA: "Pick whichever stakeholder is more senior",
        optionB: "Ground the discussion in shared data and user/business impact rather than opinions",
        optionC: "Avoid making a decision until forced to",
        optionD: "Build both features simultaneously regardless of cost",
        correctOption: "B",
        explanation: "Anchoring prioritization debates in data and shared goals (impact, effort, strategic fit) resolves disagreements more durably than authority or avoidance.",
      },
    ],
  },
  {
    roleName: "Consulting",
    topicName: "Case Fundamentals",
    questions: [
      {
        difficulty: "BEGINNER",
        questionText: "What is the primary goal of a market-sizing (guesstimate) question in a case interview?",
        optionA: "To get the exact correct number",
        optionB: "To evaluate structured, logical reasoning under ambiguity",
        optionC: "To test memorized statistics",
        optionD: "To test mental math speed only",
        correctOption: "B",
        explanation: "Guesstimates assess how logically and structurally a candidate breaks down an ambiguous problem — the exact number matters far less than the reasoning.",
      },
      {
        difficulty: "BEGINNER",
        questionText: "What does MECE stand for in case interview structuring?",
        optionA: "Mutually Exclusive, Collectively Exhaustive",
        optionB: "Maximum Efficiency, Cost Effective",
        optionC: "Multiple Estimates, Clear Evidence",
        optionD: "Market Entry, Competitive Edge",
        correctOption: "A",
        explanation: "MECE means breaking a problem into categories that don't overlap (mutually exclusive) and cover all possibilities (collectively exhaustive).",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "A client's profits are declining despite steady revenue. Which framework component should be investigated first?",
        optionA: "Only marketing spend",
        optionB: "Cost structure, since revenue is stable but profit isn't",
        optionC: "Only competitor pricing",
        optionD: "Employee satisfaction surveys",
        correctOption: "B",
        explanation: "If revenue is steady but profit is falling, the issue almost certainly lies in the cost side of the profitability equation (Profit = Revenue - Cost).",
      },
      {
        difficulty: "INTERMEDIATE",
        questionText: "In a market entry case, which factor is generally LEAST critical to assess early on?",
        optionA: "Market size and growth rate",
        optionB: "Competitive landscape",
        optionC: "The exact font used in competitor marketing materials",
        optionD: "Regulatory barriers to entry",
        correctOption: "C",
        explanation: "Market size, competition, and regulation are core to entry decisions; granular marketing design details are not a priority at the structuring stage.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "When a case reveals conflicting data (e.g. survey says demand is high, but sales data says otherwise), what's the best next step?",
        optionA: "Ignore one data source arbitrarily",
        optionB: "Investigate the discrepancy, e.g. sample bias, timing gaps, or measurement differences, before concluding",
        optionC: "Immediately end the analysis and give up",
        optionD: "Average the two conflicting numbers",
        correctOption: "B",
        explanation: "Strong case performance involves reconciling conflicting data by examining methodology and context rather than picking one arbitrarily or blending them.",
      },
      {
        difficulty: "ADVANCED",
        questionText: "A candidate is asked to recommend whether a company should acquire a competitor. What should the final recommendation always include?",
        optionA: "A yes/no answer only, with no reasoning",
        optionB: "A clear recommendation, key supporting reasons, and major risks or caveats",
        optionC: "Only the financial NPV calculation",
        optionD: "A list of every framework considered during the case",
        correctOption: "B",
        explanation: "A strong case conclusion states a clear recommendation, the 2-3 reasons driving it, and the key risks — mirroring how real consulting recommendations are delivered.",
      },
    ],
  },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`Seeded ${roles.length} roles.`);

  let topicCount = 0;
  let questionCount = 0;

  for (const t of topicData) {
    const role = await prisma.role.findUnique({ where: { name: t.roleName } });
    if (!role) continue;

    const topic = await prisma.topic.upsert({
      where: { name_roleId: { name: t.topicName, roleId: role.id } },
      update: {},
      create: { name: t.topicName, roleId: role.id },
    });
    topicCount++;

    for (const q of t.questions) {
      const existing = await prisma.mCQQuestion.findFirst({
        where: { topicId: topic.id, questionText: q.questionText },
      });
      if (existing) continue;

      await prisma.mCQQuestion.create({
        data: { topicId: topic.id, ...q },
      });
      questionCount++;
    }
  }

  console.log(`Seeded ${topicCount} topics and ${questionCount} MCQ questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
