import { Card, Button } from 'antd'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'

export function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    
    <Card className="max-w-2xl mx-auto">

{ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      {address && 
        <Card>
          {ensName ? `${ensName} (${address})` : address}
        </Card>
      }
      <Button onClick={() => disconnect()}>Disconnect</Button>
    </Card>
  )
}