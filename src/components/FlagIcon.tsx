import BD from "country-flag-icons/react/3x2/BD";
import BR from "country-flag-icons/react/3x2/BR";
import CN from "country-flag-icons/react/3x2/CN";
import DE from "country-flag-icons/react/3x2/DE";
import EG from "country-flag-icons/react/3x2/EG";
import FR from "country-flag-icons/react/3x2/FR";
import ID from "country-flag-icons/react/3x2/ID";
import IN from "country-flag-icons/react/3x2/IN";
import JP from "country-flag-icons/react/3x2/JP";
import KR from "country-flag-icons/react/3x2/KR";
import MX from "country-flag-icons/react/3x2/MX";
import PK from "country-flag-icons/react/3x2/PK";
import RU from "country-flag-icons/react/3x2/RU";
import US from "country-flag-icons/react/3x2/US";
import VN from "country-flag-icons/react/3x2/VN";

const FLAGS: Record<
  string,
  React.ComponentType<React.HTMLAttributes<HTMLElement & SVGElement>>
> = {
  US,
  CN,
  IN,
  ID,
  BR,
  RU,
  MX,
  JP,
  EG,
  VN,
  DE,
  BD,
  PK,
  KR,
  FR,
};

export default function FlagIcon({
  countryCode,
  size = 16,
}: {
  countryCode: string;
  size?: number;
}) {
  const Flag = FLAGS[countryCode];
  if (!Flag) {
    return null;
  }
  return (
    <Flag
      style={{
        width: size * 1.5,
        height: size,
        borderRadius: 2,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}
