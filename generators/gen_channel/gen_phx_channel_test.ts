import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";
import { Names } from "@/commands/immutable_gen";

const gen_phx_channel_test = (
  { singleSnake, singleUpperCamel }: Names,
  { WebDir, AppNameCamel }: AppData
) => {
  const filename = `${singleSnake}_channel_test.exs`;
  const dir = join(WebDir, "test/channels");
  const content = `defmodule ${AppNameCamel}Web.${singleUpperCamel}ChannelTest do
  use ${AppNameCamel}Web.ChannelCase

  alias ${AppNameCamel}Web.${singleUpperCamel}Channel

  setup do
    {:ok, _, socket} =
      ${AppNameCamel}Web.UserSocket
      |> socket("user_id", %{some: :assign})
      |> subscribe_and_join(${singleUpperCamel}Channel, "${singleSnake}:lobby")

    %{socket: socket}
  end

  test "ping replies with status ok", %{socket: socket} do
    ref = push(socket, "ping", %{"hello" => "there"})
    assert_reply ref, :ok, %{"hello" => "there"}
  end

  test "shout broadcasts to ${singleSnake}:lobby", %{socket: socket} do
    push(socket, "shout", %{"hello" => "all"})
    assert_broadcast "shout", %{"hello" => "all"}
  end

  test "broadcasts are pushed to the client", %{socket: socket} do
    broadcast_from!(socket, "broadcast", %{"some" => "data"})
    assert_push "broadcast", %{"some" => "data"}
  end

  describe "join/3" do
    test "allows joining with valid room id", %{socket: socket} do
      assert {:ok, _} = ${singleUpperCamel}Channel.join("${singleSnake}:lobby", %{}, socket)
    end

    test "rejects joining with invalid room id" do
      assert :error = ${singleUpperCamel}Channel.join("${singleSnake}:invalid", %{}, socket())
    end

    test "rejects malformed room IDs" do
      assert :error = ${singleUpperCamel}Channel.join("invalid_format", %{}, socket())
      assert :error = ${singleUpperCamel}Channel.join("", %{}, socket())
      assert :error = ${singleUpperCamel}Channel.join("${singleSnake}:", %{}, socket())
    end

    test "rejects join with invalid parameters" do
      assert :error = ${singleUpperCamel}Channel.join("${singleSnake}:lobby", %{"invalid" => "param"}, socket())
    end

    test "handles rate limiting for join attempts" do
      # Simulate rapid join attempts
      for _ <- 1..10 do
        assert :error = ${singleUpperCamel}Channel.join("${singleSnake}:rate_limited", %{}, socket())
      end
    end

    test "rejects join when room at capacity" do
      assert :error = ${singleUpperCamel}Channel.join("${singleSnake}:full_room", %{}, socket())
    end
  end

  describe "handle_in/3" do
    test "handles message event", %{socket: socket} do
      push(socket, "message", %{"body" => "test message"})
      assert_broadcast "message", %{"body" => "test message"}
      assert_reply :noreply
    end
  end

  describe "disconnection handling" do
    test "handles network disconnection gracefully", %{socket: socket} do
      # Simulate network disconnection
      Process.exit(socket.transport_pid, :kill)
      assert_receive {:DOWN, _, :process, _, :killed}
    end

    test "handles server-side disconnection", %{socket: socket} do
      # Simulate server shutdown
      push(socket, "server_shutdown", %{})
      assert_push "phx_error", %{reason: "server_shutdown"}
    end

    test "handles client disconnection cleanup", %{socket: socket} do
      # Test resource cleanup on disconnect
      push(socket, "disconnect", %{reason: "client_request"})
      assert_push "disconnect_ack", %{reason: "client_request"}
    end

    test "handles reconnection attempts", %{socket: socket} do
      # Test reconnection after disconnection
      push(socket, "reconnect", %{attempt: 1})
      assert_reply :ok, %{status: "reconnected"}
    end
  end

  describe "error handling" do
    test "handles invalid message format", %{socket: socket} do
      push(socket, "invalid_message", %{malformed: "data"})
      assert_push "phx_error", %{reason: "invalid_message_format"}
    end

    test "handles channel termination errors", %{socket: socket} do
      # Test terminate/2 callback
      push(socket, "terminate_channel", %{})
      assert_push "termination_error", %{reason: "cleanup_failed"}
    end
  end
end`;
  return generateFile({ filename, dir, content }, "gen_phx_channel_test");
};

export { gen_phx_channel_test };
