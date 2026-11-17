import ArrowFillButton, { type ArrowFillButtonProps } from './arrow-fill-button';

type ButtonWithIconProps = Omit<ArrowFillButtonProps, 'btnText' | 'children'> & { children: string };

/** EZWAY commercial CTAs share the fill interaction and retain real link semantics. */
export default function ButtonWithIcon({ children, ...props }: ButtonWithIconProps) {
  return <ArrowFillButton bgColor="var(--palette-cta)" textColor="var(--palette-cta-ink)"
    fillBgColor="#09090b" fillTextColor="var(--palette-cta)" hoverFillBgColor="#ffffff"
    hoverFillTextColor="#09090b" {...props} btnText={children} />;
}
