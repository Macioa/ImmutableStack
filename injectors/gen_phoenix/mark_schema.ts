import path from "path";
import { inject_file, Injection, InjectType } from "..";
import { ImmutableGenerator } from "../../immutable_gen";
import { CommentType, mark } from "../../repair";

const mark_schema = async ({
  LibDir,
  AppNameSnake,
  name,
}: ImmutableGenerator) => {
  const file = path.join(
    LibDir || ".",
    `lib/${AppNameSnake}/${name.singleSnake}.ex`
  );
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /.*/gms,
      (str) => mark({ str, type: "SCHEMA" }, "EX" as CommentType),
    ],
  ];

  return inject_file({ file, injections }, "mark_schema");
};

export { mark_schema };
