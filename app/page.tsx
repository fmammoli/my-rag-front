import MyMap from "./my-map";

export default function Home() {
  return (
    <div className={"h-[100svh] w-[100svw]"}>
      <h1>Pouso Alegre - Plano Diretor Interativo</h1>
      <div className="flex gap-4 h-full">
        <MyMap></MyMap>
      </div>
    </div>
  );
}
