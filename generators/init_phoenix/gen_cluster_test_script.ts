import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_cluster_test_script = async ({ UmbrellaDir, AppNameSnake }: AppData) => {
  const filename = "test_cluster.sh";
  const dir = UmbrellaDir || "";
  const content = `#!/bin/bash

echo "=== Testing Phoenix Clustering with libcluster ==="
echo ""

# Kill any existing processes
echo "Stopping any existing Phoenix servers..."
pkill -f "mix phx.server" 2>/dev/null || true
sleep 2

# Start first node
echo "Starting first node (a@localhost) on port 4000..."
cd ${UmbrellaDir}
PORT=4000 iex --sname a@localhost -S mix phx.server &
NODE_A_PID=$!
sleep 5

# Check if first node is running
if curl -s http://localhost:4000/nodes > /dev/null; then
    echo "✓ First node started successfully"
    echo "Node A status:"
    curl -s http://localhost:4000/nodes | jq .
else
    echo "✗ Failed to start first node"
    exit 1
fi

echo ""
echo "Starting second node (b@localhost) on port 4001..."
PORT=4001 iex --sname b@localhost -S mix phx.server &
NODE_B_PID=$!
sleep 5

# Check if second node is running
if curl -s http://localhost:4001/nodes > /dev/null; then
    echo "✓ Second node started successfully"
    echo "Node B status:"
    curl -s http://localhost:4001/nodes | jq .
else
    echo "✗ Failed to start second node"
    kill $NODE_A_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "=== Cluster Status ==="
echo "Node A (port 4000):"
curl -s http://localhost:4000/nodes | jq .

echo ""
echo "Node B (port 4001):"
curl -s http://localhost:4001/nodes | jq .

echo ""
echo "=== Manual Connection Test ==="
echo "Attempting to connect nodes manually..."

# Try to connect the nodes manually using erlang distribution
erl -sname test_connector@localhost -eval "
    NodeA = 'a@localhost',
    NodeB = 'b@localhost',
    case net_adm:ping(NodeA) of
        pong -> io:format('Connected to ~p~n', [NodeA]);
        pang -> io:format('Failed to connect to ~p~n', [NodeA])
    end,
    case net_adm:ping(NodeB) of
        pong -> io:format('Connected to ~p~n', [NodeB]);
        pang -> io:format('Failed to connect to ~p~n', [NodeB])
    end,
    timer:sleep(1000),
    io:format('Nodes visible to A: ~p~n', [rpc:call(NodeA, erlang, nodes, [])]),
    io:format('Nodes visible to B: ~p~n', [rpc:call(NodeB, erlang, nodes, [])]),
    halt().
" -noshell

echo ""
echo "=== Final Status Check ==="
echo "Node A final status:"
curl -s http://localhost:4000/nodes | jq .

echo ""
echo "Node B final status:"
curl -s http://localhost:4001/nodes | jq .

echo ""
echo "=== Cleanup ==="
echo "Stopping nodes..."
kill $NODE_A_PID $NODE_B_PID 2>/dev/null || true
sleep 2
echo "✓ Test completed"`;

  return generateFile({ filename, dir, content }, "gen_cluster_test_script");
};

export { gen_cluster_test_script };
