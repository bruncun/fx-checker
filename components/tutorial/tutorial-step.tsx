import { Checkbox } from "../ui/checkbox";

export function TutorialStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="relative">
      <Checkbox id={title} name={title} className={`mr-2 peer absolute top-[3px]`} />
      <label
        htmlFor={title}
        className={`text-base relative font-medium text-foreground peer-checked:line-through`}
      >
        <span className="ml-8">{title}</span>
        <div className={`ml-8 text-sm font-normal text-muted-foreground peer-checked:line-through`}>
          {children}
        </div>
      </label>
    </li>
  );
}
