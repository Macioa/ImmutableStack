import { getAppData } from "./readers/get_app_data";

const gen_links = async () => {
  const { AppNameCamel } = (await getAppData()) || {};
  const appname = AppNameCamel;
  const prefix = `${process.cwd()}/`;

  const links = `## back end folders:

* \x1b[33m\x1b[1mmigrations\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/priv/repo/migrations\x1b[0m
* \x1b[33m\x1b[1mschemas\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/lib/${appname}\x1b[0m
* \x1b[33m\x1b[1mcontext\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/lib\x1b[0m

## back end files:

* \x1b[33m\x1b[1mMix.Exs\x1b[0m\x1b[0m - \x1b[34m${prefix}/mix.exs\x1b[0m
* \x1b[33m\x1b[1mApplication.ex\x1b[0m\x1b[0m
  - \x1b[34m${prefix}apps/${appname}/lib/${appname}/application.ex\x1b[0m
  - \x1b[34m${prefix}apps/${appname}_web/lib/${appname}_web/application.ex\x1b[0m
* \x1b[33m\x1b[1mEndpoint.Exs\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}_web/lib/${appname}_web/endpoint.ex\x1b[0m
* \x1b[33m\x1b[1mRouter.ex\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}_web/lib/${appname}_web/router.ex\x1b[0m

## front end folders:

* \x1b[33m\x1b[1mcomponents\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/lib/typescript/components\x1b[0m
* \x1b[33m\x1b[1mstate\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/lib/typescript/state\x1b[0m
* \x1b[33m\x1b[1mrequest api\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}/lib/typescript/requests\x1b[0m

## front end files:

* \x1b[33m\x1b[1mpackage.json\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}_ui/package.json\x1b[0m
* \x1b[33m\x1b[1mApp.ts\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}_ui/src/App.tsx\x1b[0m
* \x1b[33m\x1b[1mStore\x1b[0m\x1b[0m - \x1b[34m${prefix}apps/${appname}_ui/src/store/index.ts\x1b[0m`;

  console.log(links);
};

gen_links().catch(console.error);
