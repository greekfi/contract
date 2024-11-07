import * as React from 'react'
import { Connector, useConnect } from 'wagmi'
import { Button, Space } from 'antd'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
    </Space>
  )
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <Button
      type="default"
      size="large"
      disabled={!ready}
      onClick={onClick}
      block
    >
      {connector.name}
    </Button>
  )
}