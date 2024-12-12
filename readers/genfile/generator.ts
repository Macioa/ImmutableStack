const getGenerator = (file: string): object => {
  const gen_reg =
      /(?<=const\s+Immutable:\s+ImmutableGenerator\s+=\s+)[\s\S]*?(?=[\s\n\*;]+PRIMITIVES)/,
    generatorString = file.match(gen_reg)?.[0],
    operationResults: { [key: string]: string | object } = {},
    operations: [string, (str: string) => string][] = [
      [
        "keysInQuotes",
        (str: string) => str?.replace(/^\s{0,100}(\w+):/gm, "Q_HLD$1Q_HLD:"),
      ],
      [
        "fullLineCommentsRemoved",
        (str: string) => str?.replace(/^\s{0,999}\/\/.*\n/g, ""),
      ],
      [
        "inlineCommentsRemoved",
        (str: string) => str?.replace(/\/\/.*(?=\n)/g, ""),
      ],
      [
        "trailingCommasRemoved",
        (str: string) => str?.replace(/,(?=[\s\n]+[\}\]])/gs, ""),
      ],
      ["double_escape", (str: string) => str?.replace(/\\/g, "\\\\\\\\")],
      [
        "escaped_inner_quotes",
        (str: string) =>
          str?.replace(
            /(['`\"])(.*)(\".*\")(.*)(['`\"])/g,
            (
              _match,
              openQuote,
              preceeding,
              innerQuote,
              trailing,
              closeQuote
            ) => {
              const inner =
                openQuote == closeQuote
                  ? innerQuote.replace(/\"/g, '\\"')
                  : innerQuote;
              return `${openQuote}${preceeding}${inner}${trailing}${closeQuote}`;
            }
          ),
      ],
      [
        "single_quotes_turned_double",
        (str: string) => str?.replace(/[\'\`]/g, '"'),
      ],
      ["keys_restored", (str: string) => str?.replace(/Q_HLD/g, '"')],
      [
        "trailing_semicolons_removed",
        (str: string) => str?.replace(/(?<=\})[;\/\s\n\*]+$/, ""),
      ],
      ["json_parse", (str: string) => JSON.parse(str || "{}")],
    ];

  try {
    const _parsedFile = operations.reduce((acc, [name, fn]) => {
      const newContent = fn(acc as unknown as string);
      operationResults[name] = newContent;
      return newContent;
    }, generatorString);
  } catch (e) {
    console.error("Error parsing generator file:");
    console.log("Original String:", file);
    for (let key of Object.keys(operationResults))
      console.log(`${key}:\n`, `${operationResults[key]}`, "\n\n");
    console.error(e);
    throw e;
  }

  return operationResults.json_parse as unknown as object;
};

export { getGenerator };
