import { getSession } from '@/lib/session';
import Header from '@/components/ui/Header';
import type { FC } from 'react';

const HeaderServer: FC = async () => {
  const session = await getSession();
  return <Header session={session} />;
};

export default HeaderServer;
