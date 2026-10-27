// Static lexical binding inspection only. No expression evaluation or project imports.
export const member = (node) =>
  node && ["MemberExpression", "OptionalMemberExpression"].includes(node.type);
export function literalKey(node) {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
}
export const property = (node) =>
  member(node)
    ? node.computed
      ? literalKey(node.property)
      : node.property.name
    : undefined;
const WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "ParenthesizedExpression",
]);
export function unwrap(node) {
  while (node && WRAPPERS.has(node.type)) node = node.expression;
  return node;
}
export function children(node) {
  const result = [];
  for (const [key, value] of Object.entries(node)) {
    if (
      [
        "loc",
        "extra",
        "comments",
        "tokens",
        "errors",
        "typeAnnotation",
        "typeParameters",
        "typeArguments",
        "returnType",
        "implements",
      ].includes(key)
    )
      continue;
    if (Array.isArray(value)) {
      for (const item of value)
        if (item && typeof item.type === "string") result.push(item);
    } else if (value && typeof value.type === "string") result.push(value);
  }
  return result;
}
const functionNode = (node) =>
  /Function|Method/.test(node.type) && Array.isArray(node.params);
function bindPattern(pattern, scope, binding) {
  const pending = [pattern];
  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    if (node.type === "Identifier") {
      scope.bindings.set(node.name, binding);
      scope.bound.add(node);
    } else if (node.type === "ObjectPattern") pending.push(...node.properties);
    else if (node.type === "ArrayPattern") pending.push(...node.elements);
    else if (node.type === "ObjectProperty") pending.push(node.value);
    else if (node.type === "RestElement") pending.push(node.argument);
    else if (node.type === "AssignmentPattern") pending.push(node.left);
    else if (node.type === "TSParameterProperty") pending.push(node.parameter);
  }
}
export function sourceBindings(ast) {
  const scopes = new WeakMap(),
    parents = new WeakMap();
  const root = {
    parent: null,
    kind: "function",
    bindings: new Map(),
    bound: new WeakSet(),
  };
  const nodes = [],
    pending = [{ node: ast, scope: root, parent: null }];
  while (pending.length) {
    const item = pending.pop();
    const { node, parent } = item;
    let scope = item.scope;
    if (
      [
        "FunctionDeclaration",
        "ClassDeclaration",
        "TSEnumDeclaration",
        "TSModuleDeclaration",
      ].includes(node.type)
    )
      bindPattern(node.id, scope, { kind: "other" });
    if (
      functionNode(node) ||
      [
        "ClassDeclaration",
        "ClassExpression",
        "CatchClause",
        "BlockStatement",
        "ForStatement",
        "ForInStatement",
        "ForOfStatement",
        "SwitchStatement",
        "TSModuleBlock",
        "StaticBlock",
      ].includes(node.type)
    ) {
      scope = {
        parent: scope,
        kind:
          functionNode(node) ||
          node.type === "StaticBlock" ||
          node.type === "TSModuleBlock" ||
          (node.type === "BlockStatement" &&
            functionNode(parent) &&
            parent.body === node)
            ? "function"
            : "block",
        bindings: new Map(),
        bound: root.bound,
      };
      if (functionNode(node))
        for (const param of node.params)
          bindPattern(param, scope, { kind: "other" });
      if (functionNode(node) || /Class/.test(node.type))
        bindPattern(node.id, scope, { kind: "other" });
      if (node.type === "CatchClause")
        bindPattern(node.param, scope, { kind: "other" });
    }
    scopes.set(node, scope);
    parents.set(node, parent);
    nodes.push(node);
    if (node.type === "VariableDeclaration") {
      let target = scope;
      if (node.kind === "var")
        while (target.parent && target.kind !== "function")
          target = target.parent;
      for (const declaration of node.declarations) {
        if (node.declare) continue;
        const binding = { kind: "other" };
        if (node.kind === "const" && declaration.id.type === "Identifier")
          Object.assign(binding, {
            kind: "alias",
            init: declaration.init,
            scope,
          });
        bindPattern(declaration.id, target, binding);
        if (node.kind === "const" && declaration.id.type === "ObjectPattern") {
          for (const part of declaration.id.properties) {
            const name = part.computed
              ? literalKey(part.key)
              : (part.key?.name ?? literalKey(part.key));
            if (
              part.type === "ObjectProperty" &&
              name === "env" &&
              part.value.type === "Identifier"
            )
              target.bindings.set(part.value.name, {
                kind: "env-alias",
                init: declaration.init,
                scope,
              });
          }
        }
      }
    }
    if (node.type === "ImportDeclaration" && node.importKind !== "type") {
      const builtin = ["node:process", "process"].includes(node.source.value);
      for (const specifier of node.specifiers) {
        if (specifier.importKind === "type") continue;
        const kind =
          builtin && specifier.importKind !== "type"
            ? specifier.type === "ImportDefaultSpecifier" ||
              specifier.type === "ImportNamespaceSpecifier"
              ? "process"
              : specifier.imported?.name === "env"
                ? "process.env"
                : specifier.imported?.name === "default"
                  ? "process"
                  : "other"
            : "other";
        bindPattern(specifier.local, scope, { kind });
      }
    }
    for (const child of children(node).reverse())
      pending.push({ node: child, scope, parent: node });
  }
  function bindingFor(name, scope) {
    while (scope) {
      if (scope.bindings.has(name)) return scope.bindings.get(name);
      scope = scope.parent;
    }
    return name === "process" ? { kind: "process" } : { kind: "unbound" };
  }
  function objectKind(input, scope = scopes.get(input), seen = new Set()) {
    const node = unwrap(input);
    if (!node) return;
    if (node.type === "Identifier") {
      const binding = bindingFor(node.name, scope);
      if (binding.kind === "alias" || binding.kind === "env-alias") {
        if (seen.has(binding) || seen.size >= 32) return;
        seen.add(binding);
        const kind = objectKind(binding.init, binding.scope, seen);
        return binding.kind === "env-alias"
          ? ["process", "import.meta"].includes(kind)
            ? `${kind}.env`
            : undefined
          : kind;
      }
      return ["other", "unbound"].includes(binding.kind)
        ? undefined
        : binding.kind;
    }
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require" &&
      bindingFor("require", scope).kind === "unbound" &&
      node.arguments.length === 1 &&
      ["process", "node:process"].includes(literalKey(node.arguments[0]))
    )
      return "process";
    if (
      node.type === "MetaProperty" &&
      node.meta.name === "import" &&
      node.property.name === "meta"
    )
      return "import.meta";
    if (member(node) && property(node) === "env") {
      const base = objectKind(node.object, scope, seen);
      if (base === "process" || base === "import.meta") return `${base}.env`;
    }
  }
  function outer(node) {
    let parent = parents.get(node);
    while (parent && WRAPPERS.has(parent.type)) {
      node = parent;
      parent = parents.get(node);
    }
    return { node, parent };
  }
  return {
    nodes,
    parents,
    objectKind,
    outer,
    isBinding: (node) => root.bound.has(node),
  };
}
