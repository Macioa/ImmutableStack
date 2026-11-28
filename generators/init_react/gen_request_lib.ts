import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

// Request.API is the one path for UI requests: the requests store tracks each
// call, it resolves the full typed response body, and failures reject with the server error.
const gen_request_lib = async ({ LibDir }: AppData) => {
  const dir = join(LibDir, "lib/typescript/requests");
  const content = `
import type { Dispatch } from "redux";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import merge from "deepmerge";

const env = (import.meta as any).env || {};

// Base URLs end in "/" so relative routes resolve under them
const withSlash = (url: string) => url.replace(/\\/?$/, "/");
const API_URL = withSlash(env["VITE_UI_API_URL"] || "http://localhost:4000/api/");

interface GenericAppState {
  requestsStore: RequestsStoreState;
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
      { payload }: PayloadAction<AppRequest>,
    ) {
      state.activeRequests = {
        ...state.activeRequests,
        [payload.name]: payload.request,
      };
    },
    completeRequest(
      state: RequestsStoreState,
      { payload }: PayloadAction<string>,
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
  route: string;
  options?: RequestInit;
  callback?: Function;
  // Defaults to the app API; another app's requests pass its URL
  baseUrl?: string;
};

type RequestError = Error & { status?: number; data?: any };

const TOKEN_KEY = "immutable_auth_token";

// Persists the login token for API requests and socket connections
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const storeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
};

const authHeaders = (): Record<string, string> => {
  const token = readToken();
  return token ? { Authorization: \`Bearer \${token}\` } : {};
};

const defaultOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const requestOptions = (options: RequestInit = {}): RequestInit =>
  merge(
    { ...defaultOptions, headers: { ...defaultOptions.headers, ...authHeaders() } },
    options,
  );

// Validation errors arrive as { field: [messages] }; show the first as "field message"
const fieldError = (errors?: Record<string, string[]>) =>
  errors &&
  Object.entries(errors)
    .map(([field, [first]]) => \`\${field.replace(/_/g, " ")} \${first}\`)
    .shift();

const parseBody = (res: Response) =>
  res.text().then((text) => {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return text;
    }
  });

const requestError = (res: Response, data: any): RequestError =>
  Object.assign(
    new Error(
      data?.error || fieldError(data?.errors) || \`\${res.status} \${res.statusText}\`,
    ),
    { status: res.status, data },
  );

const checked = (res: Response) =>
  parseBody(res).then((data) => {
    if (!res.ok) throw requestError(res, data);
    return data;
  });

// Every request runs through here so the requests store can track it.
// Resolves the full response body, which the generated *Response types describe.
const API = <T = any,>(details: requestAPIinterface, dispatch?: Dispatch) => {
  const { name, route, options, callback, baseUrl = API_URL } = details;
  const request: Promise<T> = fetch(new URL(route, baseUrl), requestOptions(options))
    .then(checked)
    .then((data) => {
      if (callback) callback(data);
      return data;
    })
    .finally(() => dispatch?.(completeRequest(name)));

  dispatch?.(addRequest({ name, details, request }));
  return request;
};

const Request = { API };

export { readToken, storeToken, withSlash, API_URL };

export const { addRequest, completeRequest } = requestSlice.actions;
export type {
  AppRequest,
  RequestsStoreState,
  requestAPIinterface,
  RequestError,
  GenericAppState,
};
export { initialRequestsState, requestReducer, isLoading, Request };
export default requestSlice;
`;

  return generateFile(
    { dir, filename: "index.tsx", content },
    "gen_request_lib"
  );
};

export { gen_request_lib };
