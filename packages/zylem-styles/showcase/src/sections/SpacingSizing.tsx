export function SpacingSizing() {
  return (
    <div class="section" id="spacing-sizing">
      <h2>Spacing & Sizing Tokens</h2>
      <div class="demo-row">
        <div class="demo-container">
          <h3 style={{ 'margin-top': '0' }}>Spacing</h3>
          <div style={{ display: 'flex', gap: '16px', 'align-items': 'flex-end' }}>
            <div>
              <div style={{ width: '8px', height: '8px', background: 'var(--zylem-color-primary)' }} />
              <div class="code-label">sm: 8px</div>
            </div>
            <div>
              <div style={{ width: '12px', height: '12px', background: 'var(--zylem-color-primary)' }} />
              <div class="code-label">md: 12px</div>
            </div>
            <div>
              <div style={{ width: '16px', height: '16px', background: 'var(--zylem-color-primary)' }} />
              <div class="code-label">lg: 16px</div>
            </div>
          </div>
        </div>
        <div class="demo-container">
          <h3 style={{ 'margin-top': '0' }}>Icon Sizes</h3>
          <div style={{ display: 'flex', gap: '16px', 'align-items': 'flex-end' }}>
            <div>
              <div
                style={{
                  width: 'var(--zylem-size-icon-sm)',
                  height: 'var(--zylem-size-icon-sm)',
                  background: 'var(--zylem-color-primary)',
                  'border-radius': '4px',
                }}
              />
              <div class="code-label">sm: 16px</div>
            </div>
            <div>
              <div
                style={{
                  width: 'var(--zylem-size-icon)',
                  height: 'var(--zylem-size-icon)',
                  background: 'var(--zylem-color-primary)',
                  'border-radius': '4px',
                }}
              />
              <div class="code-label">default: 28px</div>
            </div>
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--zylem-color-primary)',
                  'border-radius': '4px',
                }}
              />
              <div class="code-label">lg: 96px (scaled)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
