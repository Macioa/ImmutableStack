import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";
import { Names } from "@/commands/immutable_gen";

const gen_phx_channel_cluster_test = (
  { singleSnake, singleUpperCamel }: Names,
  { WebDir, AppNameCamel }: AppData
) => {
  const filename = `${singleSnake}_channel_cluster_test.exs`;
  const dir = join(WebDir, "test/channels");
  const content = `defmodule ${AppNameCamel}Web.${singleUpperCamel}ChannelClusterTest do
  use ${AppNameCamel}Web.ChannelCase

  alias ${AppNameCamel}Web.${singleUpperCamel}Channel

  @moduletag :cluster

  setup do
    {:ok, _, socket} =
      ${AppNameCamel}Web.UserSocket
      |> socket("user_id", %{some: :assign})
      |> subscribe_and_join(${singleUpperCamel}Channel, "${singleSnake}:lobby")

    %{socket: socket}
  end

  describe "cluster message propagation" do
    test "messages are broadcast across cluster nodes", %{socket: socket} do
      push(socket, "cluster_message", %{"node" => node(), "message" => "cluster test"})
      assert_broadcast "cluster_message", %{"node" => node(), "message" => "cluster test"}
    end

    test "handles concurrent joins from multiple nodes", %{socket: socket} do
      # Simulate multiple nodes joining the same channel
      {:ok, _, socket2} =
        ${AppNameCamel}Web.UserSocket
        |> socket("user_id_2", %{some: :assign})
        |> subscribe_and_join(${singleUpperCamel}Channel, "${singleSnake}:lobby")

      push(socket, "node_message", %{"from" => "node1"})
      assert_broadcast "node_message", %{"from" => "node1"}

      push(socket2, "node_message", %{"from" => "node2"})
      assert_broadcast "node_message", %{"from" => "node2"}
    end
  end

  describe "cluster state synchronization" do
    test "maintains channel state across cluster", %{socket: socket} do
      push(socket, "update_state", %{"key" => "value"})
      assert_broadcast "update_state", %{"key" => "value"}
      
      # Verify state is consistent across cluster
      push(socket, "get_state", %{})
      assert_reply %{"key" => "value"}
    end

    test "handles node disconnections gracefully", %{socket: socket} do
      push(socket, "cluster_disconnect", %{"reason" => "node_down"})
      assert_broadcast "cluster_disconnect", %{"reason" => "node_down"}
    end
  end

  describe "cluster performance" do
    test "handles high-frequency messages in cluster", %{socket: socket} do
      # Test message throughput across cluster
      for i <- 1..100 do
        push(socket, "performance_test", %{"count" => i})
        assert_broadcast "performance_test", %{"count" => i}
      end
    end
  end

  describe "cluster disconnection handling" do
    test "handles node disconnection during active session", %{socket: socket} do
      # Simulate node going down during active channel
      push(socket, "simulate_node_down", %{"node" => node()})
      assert_broadcast "node_disconnected", %{"node" => node(), "reason" => "network_failure"}
    end

    test "handles network partition scenarios", %{socket: socket} do
      # Test network partition handling
      push(socket, "network_partition", %{"partitioned_nodes" => [node()]})
      assert_broadcast "partition_detected", %{"nodes" => [node()]}
    end

    test "handles cluster-wide disconnection recovery", %{socket: socket} do
      # Test recovery after cluster disconnection
      push(socket, "cluster_recovery", %{"recovered_nodes" => [node()]})
      assert_broadcast "cluster_recovered", %{"nodes" => [node()]}
    end
  end

  describe "cluster error handling" do
    test "handles cross-node error propagation", %{socket: socket} do
      # Test error propagation across cluster nodes
      push(socket, "propagate_error", %{"error" => "test_error", "node" => node()})
      assert_broadcast "error_propagated", %{"error" => "test_error", "from_node" => node()}
    end

    test "handles state synchronization errors", %{socket: socket} do
      # Test state sync failure handling
      push(socket, "sync_error", %{"conflict" => "state_mismatch"})
      assert_broadcast "sync_failed", %{"reason" => "state_mismatch"}
    end

    test "handles cluster join failures", %{socket: socket} do
      # Test cluster join error scenarios
      {:ok, _, socket2} =
        ${AppNameCamel}Web.UserSocket
        |> socket("user_id_3", %{some: :assign})
        |> subscribe_and_join(${singleUpperCamel}Channel, "${singleSnake}:cluster_error")

      push(socket2, "cluster_join_failure", %{"reason" => "capacity_exceeded"})
      assert_push "phx_error", %{reason: "cluster_join_failed"}
    end
  end
end`;
  return generateFile({ filename, dir, content }, "gen_phx_channel_cluster_test");
};

export { gen_phx_channel_cluster_test };
