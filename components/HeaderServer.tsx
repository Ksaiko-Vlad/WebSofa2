import { getSession } from '@/lib/session';
import HeaderClient from '@/components/ui/Header';
import type { FC } from 'react';

const HeaderServer: FC = async () => {
  const session = await getSession();
  return <HeaderClient session={session} />;
};

export default HeaderServer;
