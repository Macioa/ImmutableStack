import { join } from "path";
import { generateFile } from "../index";

const gen_request_lib = async (LibDir: string) => {
  const dir = join(LibDir, "lib/typescript/requests");
  const literalFetchRoute = "`${API_URL}/${route}`";
  const literalErrorString =
    "`${API_URL} request failed: ${res?.status}\\n${res?.statusText}`";
  const content = `
import { Dispatch } from "redux";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import merge from "deepmerge";

interface GenericAppState {
  RequestsStore: RequestsStoreState;
  [key: string]: any;
}

type AppRequest = {
  name: string;
  request: Promise<any>;
  details: requestAPIinterface;
};

interface RequestsStoreState {
  activeRequests: {
    [key: string]: object;
  };
}

const initialRequestsState: RequestsStoreState = {
  activeRequests: {},
};

const requestSlice = createSlice({
  name: "requests",
  initialState: initialRequestsState,
  reducers: {
    addRequest(
      state: RequestsStoreState,
      { payload }: PayloadAction<AppRequest>
    ) {
      state.activeRequests = {
        ...state.activeRequests,
        [payload.name]: payload.request,
      };
    },
    completeRequest(
      state: RequestsStoreState,
      { payload }: PayloadAction<string>
    ) {
      delete state.activeRequests[payload];
    },
  },
});
const requestReducer = requestSlice.reducer;

const isLoading = (state: GenericAppState, key: string | null = null) => {
  const requests = state.requestsStore.activeRequests;
  return key ? !!requests[key] : !!Object.keys(requests).length;
};

type requestAPIinterface = {
  name: string;
  api_url_key: string;
  route: string;
  options?: RequestInit;
  callback?: Function;
};
const defaultOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const API = async (details: requestAPIinterface, dispatch: Dispatch) => {
  const { name, api_url_key, route, options, callback } = details;
  const req = new Promise<any>(async (resolve, reject) => {

    const handleError = (err: string, rej: Function) => {
      console.error(err);
      rej(err);
      dispatch(completeRequest(name));
    };
    const handleSuccess = (data: any, res: Function) => {
      if (callback) callback(data);
      res(data);
      dispatch(completeRequest(name));
    };

    try {
      const API_URL = import.meta.env[api_url_key] || "http://localhost:4000/api/",
        reqOptions = merge(defaultOptions, options || {});

      const res = await fetch(${literalFetchRoute}, reqOptions)
        .catch((err) => handleError(String(err), reject));

      if (!res?.ok)
        handleError(
          ${literalErrorString},
          reject
        );

      handleSuccess(await res?.json(), resolve);
    } catch (error) {
      handleError(String(error), reject);
    }
  });

  dispatch(addRequest({ name, details, request: req }));
  return (await req).data;
};

const Request = { API };

export const { addRequest, completeRequest } = requestSlice.actions;
export type { AppRequest, RequestsStoreState, requestAPIinterface, GenericAppState };
export {
  initialRequestsState,
  requestReducer,
  isLoading,
  Request,
};
export default requestSlice;
`;

  return generateFile(
    { dir, filename: "index.tsx", content },
    "gen_request_lib",
  );
};

export { gen_request_lib };
