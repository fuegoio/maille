import defaultMdxComponents from "fumadocs-ui/mdx";
import { Card, Cards, type CardProps } from "fumadocs-ui/components/card";
import { Callout, type CalloutType } from "fumadocs-ui/components/callout";
import type { ComponentProps } from "react";

function MailleCards(props: ComponentProps<typeof Cards>) {
  return <Cards {...props} className={`maille-cards ${props.className ?? ""}`} />;
}

function MailleCard(props: CardProps) {
  return <Card {...props} className={`maille-card ${props.className ?? ""}`} />;
}

function MailleCallout({
  type,
  className,
  ...props
}: Omit<ComponentProps<typeof Callout>, "type"> & { type?: CalloutType }) {
  return <Callout {...props} type={type} className={`maille-callout ${className ?? ""}`} />;
}

export const mdxComponents = {
  ...defaultMdxComponents,
  Card: MailleCard,
  Cards: MailleCards,
  Callout: MailleCallout,
};
