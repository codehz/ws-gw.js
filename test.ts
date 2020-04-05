import Client from "./index";

const args = {
  endpoint: "ws://127.0.0.1:8808",
  name: "sdk-demo",
};

const enc = new TextEncoder();
const dec = new TextDecoder();

async function main() {
  const client = new Client();
  console.info("connecting to %s", args.endpoint);
  await client.connect(args.endpoint, (e) => console.error("err %#v", e));
  console.info("connected, get service %s", args.name);
  const srv = await client.get(args.name);
  console.info("got service, waiting online");
  await srv.waitOnline();
  console.info("subscribe event");
  await srv.on("test", async (data) => {
    console.info("received event: %#v", dec.decode(data));
  });
  console.info("call delay(200)");
  await srv.call("delay", new Uint8Array(255));
  console.info("call echo('test')");
  const res = await srv.call("echo", enc.encode("test"));
  console.info("back: %s", dec.decode(res));
  try {
    console.info("call exception");
    await srv.call("exception", enc.encode("expected exception"));
    console.error("should never go here");
  } catch (e) {
    if (!(typeof e === "string")) {
      console.error("%#v", e);
    } else {
      console.info("got exception: %s", e);
    }
  }
  console.info("try emit event");
  await srv.call(
    "broadcast",
    new Uint8Array([4, ...enc.encode("test"), ...enc.encode("boom")])
  );
  console.info("delay 1s");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.info("bye service");
  await srv.disconnect();
  console.info("disconnect");
  await client.disconnect();
  console.info("now exit");
}

main().catch(console.error);
