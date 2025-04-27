// Country code data with SVG flags
import { ReactNode } from "react"

// SVG Flags for countries
const USFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <g fillRule="evenodd">
      <g strokeWidth="1pt">
        <path fill="#bd3d44" d="M0 0h640v480H0" />
        <path
          d="M0 55.3h640M0 111h640M0 166.7h640M0 222.3h640M0 277.7h640M0 333.3h640M0 388.7h640"
          stroke="#fff"
          strokeWidth="37"
        />
      </g>
      <path fill="#192f5d" d="M0 0h364.8v258.5H0" />
      <path
        fill="#fff"
        d="M30.4 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3L25 27.6l-8.7-6.3h10.9zm60.8 0l3.3 10.3h10.8l-8.7 6.3 3.2 10.3-8.6-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.3h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.3h10.7l-8.6 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.3h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.2-10.2-8.6-6.3h10.7zm60.8 0l3.3 10.3h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zM60.8 37l3.3 10.2H75l-8.7 6.2 3.2 10.3-8.6-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8L127 53.4l3.3 10.3-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.2 3.3 10.3-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.7l-8.6 6.2 3.3 10.3-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.2 3.3 10.3-8.7-6.3-8.6 6.3 3.2-10.3-8.6-6.2h10.7zM30.4 62.6l3.4 10.4h10.6l-8.6 6.3 3.3 10.2-8.7-6.3-8.6 6.3L25 79.3l-8.7-6.3h10.9zm60.8 0l3.3 10.4h10.8l-8.7 6.3 3.2 10.2-8.6-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.4h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.4h10.7l-8.6 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.4h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.6 6.3 3.2-10.2-8.6-6.3h10.7zm60.8 0l3.3 10.4h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zM60.8 88.6l3.3 10.2H75l-8.7 6.3 3.2 10.3-8.6-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.7l-8.6 6.3 3.3 10.3-8.7-6.4-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.2-10.2-8.6-6.3h10.7zM30.4 114.5l3.4 10.2h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3 3.2-10.2-8.7-6.3h10.9zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.2 10.2-8.6-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.7l-8.6 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.6 6.3 3.2-10.2-8.6-6.3h10.7zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.2-8.6-6.3h10.6zM60.8 140.4l3.3 10.2H75l-8.7 6.3 3.2 10.2-8.6-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.7l-8.6 6.3 3.3 10.2-8.7-6.3-8.7 6.3 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.2-8.7-6.3-8.6 6.3 3.2-10.3-8.6-6.2h10.7zM30.4 166.3l3.4 10.2h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.4 3.2-10.3-8.7-6.3h10.9zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.2 10.3-8.6-6.4-8.7 6.4 3.3-10.3-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.7l-8.6 6.3 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.3h10.6zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.6 6.4 3.2-10.3-8.6-6.3h10.7zm60.8 0l3.3 10.2h10.8l-8.7 6.3 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.3h10.6zM60.8 192.2l3.3 10.3H75l-8.7 6.2 3.2 10.3-8.6-6.4-8.7 6.4 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.3h10.8l-8.7 6.2 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.3h10.8l-8.7 6.2 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.3h10.7l-8.6 6.2 3.3 10.3-8.7-6.4-8.7 6.4 3.3-10.3-8.6-6.2h10.6zm60.8 0l3.3 10.3h10.8l-8.7 6.2 3.3 10.3-8.7-6.4-8.6 6.4 3.2-10.3-8.6-6.2h10.7z"
      />
    </g>
  </svg>
)

const UKFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#FFF"
      d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
    />
    <path
      fill="#C8102E"
      d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
    />
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
  </svg>
)

const DEFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#ffce00" d="M0 320h640v160H0z" />
    <path d="M0 0h640v160H0z" />
    <path fill="#d00" d="M0 160h640v160H0z" />
  </svg>
)

const FRFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#00267f" d="M0 0h213.3v480H0z" />
      <path fill="#f31830" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
)
const AUFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10080 5040"
    className="w-5 h-3"
  >
    <defs>
      <clipPath id="c">
        <path d="M0,0V1.5H7V3H6zM6,0H3V3.5H0V3z" />
      </clipPath>
      <path
        id="Star7"
        d="M0,-360 69.421398,-144.155019 281.459334,-224.456329 155.988466,-35.603349 350.974048,80.107536 125.093037,99.758368 156.198146,324.348792 0,160 -156.198146,324.348792 -125.093037,99.758368 -350.974048,80.107536 -155.988466,-35.603349 -281.459334,-224.456329 -69.421398,-144.155019z"
      />
      <path
        id="Star5"
        d="M0,-210 54.859957,-75.508253 199.721868,-64.893569 88.765275,28.841586 123.434903,169.893569 0,93.333333 -123.434903,169.893569 -88.765275,28.841586 -199.721868,-64.893569 -54.859957,-75.508253z"
      />
      <use id="Cstar" href="#Star7" transform="scale(2.1)" />
    </defs>
    <g transform="scale(840)">
      <rect width="12" height="6" fill="#00008b" />
      <path d="M0,0 6,3M6,0 0,3" stroke="#fff" strokeWidth="0.6" />
      <path
        d="M0,0 6,3M6,0 0,3"
        stroke="#f00"
        strokeWidth="0.4"
        clipPath="url(#c)"
      />
      <path d="M3,0V3.5M0,1.5H7" stroke="#fff" />
      <path d="M3,0V3.5M0,1.5H7" stroke="#f00" strokeWidth="0.6" />
      <path d="M0,3H6V0H8V4H0z" fill="#00008b" />
    </g>
    <g fill="#fff">
      <use id="Comwlth" href="#Cstar" x="2520" y="3780" />
      <use id="αCrucis" href="#Star7" x="7560" y="4200" />
      <use id="βCrucis" href="#Star7" x="6300" y="2205" />
      <use id="γCrucis" href="#Star7" x="7560" y="840" />
      <use id="δCrucis" href="#Star7" x="8680" y="1869" />
      <use id="εCrucis" href="#Star5" x="8064" y="2730" />
    </g>
  </svg>
)

const JPFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <defs>
      <clipPath id="jp">
        <path fillOpacity=".7" d="M-88 32h640v480H-88z" />
      </clipPath>
    </defs>
    <g
      fillRule="evenodd"
      strokeWidth="1pt"
      clipPath="url(#jp)"
      transform="translate(88 -32)"
    >
      <path fill="#fff" d="M-128 32h720v480h-720z" />
      <circle
        cx="523.1"
        cy="275.1"
        r="194.9"
        fill="#d30000"
        transform="translate(-168.4 8.6) scale(.76554)"
      />
    </g>
  </svg>
)

const CNFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <defs>
      <path id="a" fill="#ffde00" d="M-.6.8L0-1 .6.8-1-.3h2z" />
    </defs>
    <path fill="#de2910" d="M0 0h640v480H0z" />
    <use
      width="30"
      height="20"
      transform="matrix(71.9991 0 0 72 120 120)"
      xlinkHref="#a"
    />
    <use
      width="30"
      height="20"
      transform="matrix(-12.33562 -20.5871 20.58684 -12.33577 240.3 48)"
      xlinkHref="#a"
    />
    <use
      width="30"
      height="20"
      transform="matrix(-3.38573 -23.75998 23.75968 -3.38578 288 95.8)"
      xlinkHref="#a"
    />
    <use
      width="30"
      height="20"
      transform="matrix(6.5991 -23.0749 23.0746 6.59919 288 168)"
      xlinkHref="#a"
    />
    <use
      width="30"
      height="20"
      transform="matrix(14.9991 -18.73557 18.73533 14.99929 240 204)"
      xlinkHref="#a"
    />
  </svg>
)

const INFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#f93" d="M0 0h640v160H0z" />
    <path fill="#fff" d="M0 160h640v160H0z" />
    <path fill="#128807" d="M0 320h640v160H0z" />
    <g transform="matrix(3.2 0 0 3.2 320 240)">
      <circle r="20" fill="#008" />
      <circle r="17.5" fill="#fff" />
      <circle r="3.5" fill="#008" />
      <g id="d">
        <g id="c">
          <g id="b">
            <g id="a" fill="#008">
              <circle r=".9" transform="rotate(7.5 -8.8 133.5)" />
              <path d="M0 17.5L.6 7 0 2l-.6 5L0 17.5z" />
            </g>
            <use
              width="100%"
              height="100%"
              transform="rotate(15)"
              xlinkHref="#a"
            />
          </g>
          <use
            width="100%"
            height="100%"
            transform="rotate(30)"
            xlinkHref="#b"
          />
        </g>
        <use width="100%" height="100%" transform="rotate(60)" xlinkHref="#c" />
      </g>
      <use width="100%" height="100%" transform="rotate(120)" xlinkHref="#d" />
      <use width="100%" height="100%" transform="rotate(-120)" xlinkHref="#d" />
    </g>
  </svg>
)

const MXFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#ce1126" d="M426.7 0H640v480H426.7" />
    <path fill="#fff" d="M213.3 0h213.4v480H213.3" />
    <path fill="#006847" d="M0 0h213.3v480H0" />
    <circle
      cx="320"
      cy="240"
      r="60"
      fill="#ce1126"
      stroke="#006847"
      strokeWidth="6"
    />
    <path
      fill="#ce1126"
      d="M243 303.2c-10.7 15.7-11.7 33.3-6.5 50.4 0 0 60-88.7 170-88.7s129.5 23.9 129.5 23.9c17.5-63.4-24.7-63-24.7-63l-268.3 77.4z"
    />
    <circle cx="320" cy="240" r="30" fill="#006847" />
  </svg>
)

const BRFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#229e45" d="M0 0h640v480H0z" />
    <path fill="#f8e509" d="M320 75l229.8 167.5L320 410 90.2 242.5z" />
    <circle
      cx="320"
      cy="242.5"
      r="94.5"
      fill="#2b49a3"
      stroke="#fff"
      strokeWidth="11"
    />
    <path
      fill="#ffffef"
      d="M312.5 242.5l15.3-10 7.8 16.7 10.6-15 12.3 14-5-18.8 18-7.5-16.8-8.7 5.2-18.8-15 10.5-11.8-14.6-4 19-18.4 6.2 17.5 8.1z"
    />
  </svg>
)

const CAFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className="w-5 h-4"
  >
    <path fill="#fff" d="M0 0h640v480H0z" />
    <path fill="#d52b1e" d="M0 0h160v480H0zm480 0h160v480H480z" />
    <path
      fill="#d52b1e"
      d="M312.5 90.5L320 66l7.5 24.5H352l-19.5 14 7.5 24.5-19.5-14-19.5 14 7.5-24.5-19.5-14zM320 432l-42.4-72H352z"
    />
  </svg>
)

// Define country code data with SVG flag components
const countryCodes: { code: string; country: string; flag: ReactNode }[] = [
  { code: "1", country: "US & CA", flag: <USFlag /> },
  { code: "44", country: "UK", flag: <UKFlag /> },
  { code: "49", country: "DE", flag: <DEFlag /> },
  { code: "33", country: "FR", flag: <FRFlag /> },
  { code: "61", country: "AU", flag: <AUFlag /> },
  { code: "81", country: "JP", flag: <JPFlag /> },
  { code: "86", country: "CN", flag: <CNFlag /> },
  { code: "91", country: "IN", flag: <INFlag /> },
  { code: "52", country: "MX", flag: <MXFlag /> },
  { code: "55", country: "BR", flag: <BRFlag /> },
]

export default countryCodes
