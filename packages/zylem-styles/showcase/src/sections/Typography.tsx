export function Typography() {
  return (
    <div class="section" id="typography">
      <h2>Typography</h2>
      <h3>.zylem-exo-2</h3>
      <div class="demo-container">
        <p
          class="zylem-exo-2"
          style={{
            'font-size': '24px',
            'font-weight': 700,
            margin: '0 0 8px 0',
            color: 'var(--zylem-color-primary)',
          }}
        >
          Exo 2 Bold - Heading
        </p>
        <p
          class="zylem-exo-2"
          style={{
            'font-size': '18px',
            'font-weight': 600,
            margin: '0 0 8px 0',
            color: 'var(--zylem-color-primary)',
          }}
        >
          Exo 2 SemiBold - Subheading
        </p>
        <p
          class="zylem-exo-2"
          style={{
            'font-size': '14px',
            'font-weight': 400,
            margin: '0',
            color: 'var(--zylem-color-primary)',
          }}
        >
          Exo 2 Regular - Body text for the Zylem game engine interface. This is the default font style used
          throughout the editor.
        </p>
      </div>
    </div>
  );
}
