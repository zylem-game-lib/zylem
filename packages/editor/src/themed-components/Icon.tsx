import { Component, ComponentProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { LucideProps } from 'lucide-solid';

interface IconProps extends LucideProps {
  icon: Component<LucideProps>;
}

export const Icon: Component<IconProps> = (props) => {
  const [local, others] = splitProps(props, ['icon', 'class']);

  return (
    <Dynamic
      component={local.icon}
      class={`text-current ${local.class || ''}`}
      {...others}
    />
  );
};
