import type { JSXElement, ParentComponent, VoidComponent } from 'solid-js'
import clsx from 'clsx'

import ButtonBase from '~/components/material/ButtonBase'
import Typography from '~/components/material/Typography'

type ListItemContentProps = {
  headline: JSXElement
  subhead?: JSXElement
}

export const ListItemContent: VoidComponent<ListItemContentProps> = (props) => {
  return (
    <div>
      <Typography color="on-surface" variant="body-lg" as="div">
        {props.headline}
      </Typography>
      {props.subhead && (
        <Typography color="on-surface-variant" variant="body-md" as="div">
          {props.subhead}
        </Typography>
      )}
    </div>
  )
}

type ListItemProps = {
  class?: string
  variant?: '1-line' | '2-line' | '3-line' | 'nav'
  selected?: boolean
  leading?: JSXElement
  trailing?: JSXElement
  onClick?: () => void
  href?: string
}

// TODO: guess variant from content
export const ListItem: ParentComponent<ListItemProps> = (props) => {
  const variant = () => props.variant || '1-line'
  const variantStyle = () =>
    ({
      '1-line': 'h-14',
      '2-line': 'h-20',
      '3-line': 'h-28',
      nav: 'h-14 before:rounded-full',
    }[variant()])
  return (
    <ButtonBase
      class={clsx(
        'elevation-0 state-layer flex items-center gap-4 py-2 pl-4 pr-6 transition-colors before:bg-on-surface',
        variantStyle(),
        props.selected && 'before:opacity-[.12]',
        props.class,
      )}
      onClick={props.onClick}
      href={props.href}
    >
      {props.leading}
      {props.children}
      {props.trailing && <span class="ml-auto">{props.trailing}</span>}
    </ButtonBase>
  )
}

type ListProps = {
  class?: string
  variant?: 'nav'
}

const List: ParentComponent<ListProps> = (props) => {
  return (
    <div
      class={clsx(
        'flex flex-col',
        props.variant === 'nav' ? 'gap-0' : 'gap-2',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

export default List