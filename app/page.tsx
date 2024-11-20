import MyMap from "./my-map";

export default function Home() {
  return (
    <div className={"h-[100svh] w-[100svw]"}>
      <h1>Pouso Alegre - Plano Diretor Interativo</h1>

      <MyMap></MyMap>
    </div>
  );
}
