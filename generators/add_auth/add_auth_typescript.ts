import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_user_requests = async ({
  LibDir,
  ApiNameSnake,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/requests");
  const filename = "User.tsx";
  const authApiUrl = `(import.meta as any).env["VITE_AUTH_URL"] || "http://localhost:4002"`;
  const content = `import type { Dispatch } from "redux";
import { Request } from "./index";
import { setUserdata, setToken } from "../state/User";
import type { User } from "../state/User";
import type {
  UserResponse,
  CountUserResponse,
  PartialUserResponse,
} from "./UserResponse";

const AUTH_API_URL =
  ${authApiUrl};

const authRequest = async (
  route: string,
  options: RequestInit = {},
  dispatch: Dispatch,
  name: string,
  callback?: (data: any) => void,
) => {
  const url = \`\${AUTH_API_URL}/api/\${route}\`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };
  const mergedOptions = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    credentials: "include" as RequestCredentials,
  };

  try {
    const res = await fetch(url, mergedOptions);
    let data;
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    
    try {
      data = isJson ? await res.json() : await res.text();
    } catch (parseError) {
      data = await res.text().catch(() => ({ error: "Failed to parse response" }));
    }
    
    if (!res.ok) {
      const error = new Error(\`\${res.status} \${res.statusText}\`) as any;
      error.status = res.status;
      error.data = data;
      throw error;
    }
    
    if (callback) {
      callback(data);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// ** IMMUTABLE User REQUEST_API 2484e23c-edf7-4244-b522-d3cbeb0f57f8 **
const requestCurrentUser = (dispatch: Dispatch) => {
  return authRequest(
    "users/settings",
    { method: "GET" },
    dispatch,
    "fetchCurrentUser",
    (res: any) => {
      if (res.data) {
        dispatch(setUserdata(res.data));
      }
      if (res.token) {
        dispatch(setToken(res.token));
      }
    },
  ) as Promise<UserResponse>;
};
// ** IMMUTABLE User REQUEST_API 2484e23c-edf7-4244-b522-d3cbeb0f57f8 **

// ** IMMUTABLE User REQUEST_API d608eb42-1848-4a4c-a9f7-315cb6294541 **
const updateUser = (user: User, dispatch: Dispatch) =>
  authRequest(
    "users/settings",
    {
      method: "PUT",
      body: JSON.stringify(user),
    },
    dispatch,
    "updateUser",
    (_data: any) => null,
  ) as Promise<PartialUserResponse>;
// ** IMMUTABLE User REQUEST_API d608eb42-1848-4a4c-a9f7-315cb6294541 **

// ** IMMUTABLE User REQUEST_API a1b2c3d4-e5f6-7890-abcd-ef1234567890 **
const loginUser = (credentials: { email: string; password: string }, dispatch: Dispatch) =>
  authRequest(
    "users/log_in",
    {
      method: "POST",
      body: JSON.stringify({ user: credentials }),
    },
    dispatch,
    "loginUser",
    (res: any) => {
      if (res.data) dispatch(setUserdata(res.data));
      if (res.token) dispatch(setToken(res.token));
    },
  ) as Promise<UserResponse>;
// ** IMMUTABLE User REQUEST_API a1b2c3d4-e5f6-7890-abcd-ef1234567890 **

// ** IMMUTABLE User REQUEST_API b2c3d4e5-f6a7-8901-bcde-f12345678901 **
const registerUser = (userData: { email: string; password: string }, dispatch: Dispatch) =>
  authRequest(
    "users/register",
    {
      method: "POST",
      body: JSON.stringify({ user: userData }),
    },
    dispatch,
    "registerUser",
    (res: any) => {
      if (res.data) dispatch(setUserdata(res.data));
      if (res.token) dispatch(setToken(res.token));
    },
  ) as Promise<UserResponse>;
// ** IMMUTABLE User REQUEST_API b2c3d4e5-f6a7-8901-bcde-f12345678901 **

// ** IMMUTABLE User REQUEST_API c3d4e5f6-g7h8-9012-cdef-012345678901 **
const logoutUser = (dispatch: Dispatch) =>
  authRequest(
    "users/log_out",
    {
      method: "DELETE",
    },
    dispatch,
    "logoutUser",
    () => {
      dispatch(setUserdata(null as any));
      dispatch(setToken(""));
    },
  ) as Promise<CountUserResponse>;
// ** IMMUTABLE User REQUEST_API c3d4e5f6-g7h8-9012-cdef-012345678901 **

// ** IMMUTABLE User REQUEST_API d4e5f6g7-h8i9-0123-def0-123456789012 **
const initiateOAuth = (provider: "google" | "microsoft", redirectTo?: string) => {
  const redirectUrl = redirectTo || window.location.origin + window.location.pathname;
  const params = new URLSearchParams({ redirect_to: redirectUrl, popup: "true" });
  const oauthUrl = \`\${AUTH_API_URL}/oauth/\${provider}?\${params.toString()}\`;

  const width = 600;
  const height = 700;
  const left = Math.round((window.screen.width - width) / 2);
  const top = Math.round((window.screen.height - height) / 2);
  const features = [
    \`width=\${width}\`,
    \`height=\${height}\`,
    \`left=\${left}\`,
    \`top=\${top}\`,
    \`toolbar=no\`,
    \`menubar=no\`,
    \`location=no\`,
    \`status=no\`,
    \`resizable=yes\`,
    \`scrollbars=yes\`,
  ].join(",");

  const popup = window.open(oauthUrl, "oauth_popup", features);
  
  if (popup) {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
      }
    }, 500);
    
    setTimeout(() => {
      clearInterval(checkClosed);
    }, 5 * 60 * 1000);
  }
};
// ** IMMUTABLE User REQUEST_API d4e5f6g7-h8i9-0123-def0-123456789012 **

export { requestCurrentUser, updateUser, loginUser, registerUser, logoutUser, initiateOAuth };
`;

  return generateFile({ dir, filename, content }, "add_auth_user_requests");
};

const add_auth_user_response = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/requests");
  const filename = "UserResponse.tsx";
  const content = `// ** IMMUTABLE User API_RESPONSE cd4e6565-45ea-4e2b-b332-81a692d67add **
import type { User } from "../state/User";

type BaseQuery = { query?: Record<string, any> };

type UserResponse = BaseQuery & { data: User | User[]; count?: number };

type CountUserResponse = { success_count: number; fail_count: number };

type PartialUserResponse = BaseQuery & {
  success_count: number;
  fail_count: number;
  data: User[];
  failed: any[];
};

type AllUserResponse = UserResponse | CountUserResponse | PartialUserResponse;

export type { UserResponse, CountUserResponse, PartialUserResponse, AllUserResponse };
// ** IMMUTABLE User API_RESPONSE cd4e6565-45ea-4e2b-b332-81a692d67add **
`;

  return generateFile({ dir, filename, content }, "add_auth_user_response");
};

const add_auth_user_state = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/state");
  const filename = "User.tsx";
  const content = `import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// ** IMMUTABLE Account TYPEDEF a7c32642-db39-4182-b0b6-fbbe96ce9785 **
type Account = {
  id: string | null;
  name: string | null;
  parent_account_id: string | null;
  owner_id: string | null;
  master_account: Account | null;
  parent_accounts: Account[] | null;
  access_tags: Record<string, any>[] | null;
  inserted_at: string | null;
  updated_at: string | null;
};
// ** IMMUTABLE Account TYPEDEF a7c32642-db39-4182-b0b6-fbbe96ce9785 **

// ** IMMUTABLE User TYPEDEF 75232642-db39-4182-b0b6-fbbe96ce9785 **
type User = {
  id: string | null;
  email: string | null;
  confirmed_at: string | null;
  access_tags: Record<string, any>[] | null;
  accounts: Account[] | null;
  inserted_at: string | null;
  updated_at: string | null;
};
// ** IMMUTABLE User TYPEDEF 75232642-db39-4182-b0b6-fbbe96ce9785 **

// ** IMMUTABLE User APPSTATE 5f91e83a-2224-4eef-a1f2-cdc4f5863fba **
interface UserStoreState {
  userdata: User | null;
  token: string | null;
}
// ** IMMUTABLE User APPSTATE 5f91e83a-2224-4eef-a1f2-cdc4f5863fba **

// ** IMMUTABLE User INITIAL_APPSTATE e3c55e4a-8283-4d3a-a29e-8510132f832a **
const initialUserStoreStateState: UserStoreState = { userdata: null, token: null };
// ** IMMUTABLE User INITIAL_APPSTATE e3c55e4a-8283-4d3a-a29e-8510132f832a **

const userSlice = createSlice({
  name: "User",
  initialState: initialUserStoreStateState,
  reducers: {
    // ** IMMUTABLE User REDUCER f65d0bf8-fd5f-434c-bbeb-0d897d641d45 **
    setUserdata(state: UserStoreState, action: PayloadAction<User>) {
      state.userdata = action.payload;
    },
    // ** IMMUTABLE User REDUCER f65d0bf8-fd5f-434c-bbeb-0d897d641d45 **
    // ** IMMUTABLE User REDUCER 3aa3731c-649f-46e1-b028-e56a96715e27 **
    setToken(state: UserStoreState, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    // ** IMMUTABLE User REDUCER 3aa3731c-649f-46e1-b028-e56a96715e27 **
  },
});
const UserReducer = userSlice.reducer;

// ** IMMUTABLE User SELECTOR 1311feef-8b6f-4a8d-87e7-3090e82916da **
const selectUserdata = (state: GenericAppState) => state.UserStore.userdata;
// ** IMMUTABLE User SELECTOR 1311feef-8b6f-4a8d-87e7-3090e82916da **

// ** IMMUTABLE User SELECTOR 5e973f17-d954-47aa-8eb3-3f93a82b557b **
const selectToken = (state: GenericAppState) => state.UserStore.token;
// ** IMMUTABLE User SELECTOR 5e973f17-d954-47aa-8eb3-3f93a82b557b **

// ** IMMUTABLE User GENERIC_APPSTATE 6a5d9da8-b06b-4d18-8da6-d2e26d40887c **
interface GenericAppState {
  UserStore: UserStoreState;
  [key: string]: any;
}
// ** IMMUTABLE User GENERIC_APPSTATE 6a5d9da8-b06b-4d18-8da6-d2e26d40887c **

const { setUserdata, setToken } = userSlice.actions;
export { setUserdata, setToken };
export type { User, Account, UserStoreState, GenericAppState };
export {
  initialUserStoreStateState,
  UserReducer,
  selectUserdata,
  selectToken,
};
export default userSlice;
`;

  return generateFile({ dir, filename, content }, "add_auth_user_state");
};

const add_auth_user_state_test = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/state");
  const filename = "User.test.tsx";
  const content = `import userSlice, {
  setUserdata,
  setToken,
  selectUserdata,
  selectToken,
  initialUserStoreStateState,
  type User,
} from "./User";

// ** IMMUTABLE User REDUCER TEST f343e76a-d7db-4ece-bf87-36883c03c149 **
it("setUserdata(state: UserStoreState, action: PayloadAction<User>", () => {
  const user: User = {
    id: "test-id",
    email: "test@example.com",
    confirmed_at: null,
    access_tags: [],
    accounts: [],
    inserted_at: null,
    updated_at: null,
  };
  const state = userSlice.reducer(initialUserStoreStateState, setUserdata(user));
  expect(state.userdata).toEqual(user);
});
// ** IMMUTABLE User REDUCER TEST f343e76a-d7db-4ece-bf87-36883c03c149 **

// ** IMMUTABLE User REDUCER TEST f1b784e1-cd6e-49c9-9ba7-9a1dd12e4a96 **
it("setToken(state: UserStoreState, action: PayloadAction<string>", () => {
  const token = "test-token-123";
  const state = userSlice.reducer(initialUserStoreStateState, setToken(token));
  expect(state.token).toEqual(token);
});
// ** IMMUTABLE User REDUCER TEST f1b784e1-cd6e-49c9-9ba7-9a1dd12e4a96 **

// ** IMMUTABLE User SELECTOR TEST 82c1b7e6-2f10-43c0-a09e-c0fdeed85c01 **
it("selectUserdata = (state: GenericAppState)", () => {
  const user: User = {
    id: "test-id",
    email: "test@example.com",
    confirmed_at: null,
    access_tags: [],
    accounts: [],
    inserted_at: null,
    updated_at: null,
  };
  const state = userSlice.reducer(initialUserStoreStateState, setUserdata(user));
  const selectedUserdata = selectUserdata({ UserStore: state });
  expect(selectedUserdata).toEqual(user);
});
// ** IMMUTABLE User SELECTOR TEST 82c1b7e6-2f10-43c0-a09e-c0fdeed85c01 **

// ** IMMUTABLE User SELECTOR TEST 8349ac8b-9808-472f-b528-59589fe2e732 **
it("selectToken", () => {
  const token = "test-token-456";
  const state = userSlice.reducer(initialUserStoreStateState, setToken(token));
  const selectedToken = selectToken({ UserStore: state });
  expect(selectedToken).toEqual(token);
});
// ** IMMUTABLE User SELECTOR TEST 8349ac8b-9808-472f-b528-59589fe2e732 **
`;

  return generateFile({ dir, filename, content }, "add_auth_user_state_test");
};

export {
  add_auth_user_requests,
  add_auth_user_response,
  add_auth_user_state,
  add_auth_user_state_test,
};


